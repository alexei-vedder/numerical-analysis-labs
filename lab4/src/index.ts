import d3 from "d3";
import {abs, evaluate, simplify, pi, pow} from "mathjs";

window.d3 = d3;

const func: string = "8*pi*(sqrt(12 + pi*x))";

const funcAndSplinesPlot = require("function-plot");
const splineErrorsPlot = require("function-plot");

const plotElem = (id: string) => {
    return document.getElementById(id);
};

const plotOptions = (title: string, target: HTMLElement | null, xAxis: {}, yAxis: {}, ...data: Object[]) => {
    return {
        title: title,
        width: 600,
        height: 270,
        target: target,
        xAxis: xAxis,
        yAxis: yAxis,
        tip: {
            renderer: () => {
            }
        },
        grid: true,
        data: data
    }
};

interface TabulatedFunction {
    x: number[];
    y: number[];
}

function tabulateFunction(func: string, from: number, to: number, partition: number): TabulatedFunction {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }

    let xCurrent = from;
    let partLength = (to - from) / partition;
    let tableFunction: TabulatedFunction = {x: [], y: []};
    while (xCurrent <= to) {
        tableFunction.x.push(xCurrent);
        tableFunction.y.push(evaluate(func, {x: xCurrent}));
        xCurrent += partLength;
    }
    return tableFunction;
}

function calculateLinearSpline(tFunc: TabulatedFunction, x: number): number {
    let solution: number = 0;
    for (let i = 0; i < tFunc.x.length; ++i) {
        let l: number = 1;
        for (let j = 0; j < tFunc.x.length; ++j) {
            if (i !== j) {
                l *= (x - tFunc.x[j]) / (tFunc.x[i] - tFunc.x[j])
            }
        }
        solution += (tFunc.y[i] * l);
    }
    return solution;
}

function calculateCubicSplineCoeffs(tFunc: TabulatedFunction): number[] {
    const n = tFunc.x.length;

    let k: number[] = new Array(n + 1).fill(0);
    let c: number[] = new Array(n + 1).fill(0);

    for (let i = 2; i < n; ++i) {
        let j: number = i - 1;
        let m: number = j - 1;
        let a: number = tFunc.x[i] - tFunc.x[j];
        let b: number = tFunc.x[j] - tFunc.x[m];
        let r: number = 2 * (a + b) - b * c[j];
        c[i] = a / r;
        k[i] = (3 * ((tFunc.y[i] - tFunc.y[j]) / a - (tFunc.y[j] - tFunc.y[m]) / b) - b * k[j]) / r;
    }
    c[n] = k[n];
    for (let i = n - 1; 2 <= i; --i) {
        c[i] = k[i] - c[i] * c[i + 1]
    }
    return c;
}

function calculateCubicSpline(tFunc: TabulatedFunction, x: number, coeffs: number[]): number {
    const n = tFunc.x.length;

    let i = 1;
    // finding a near node number
    while ((tFunc.x[i] < x) && (i !== n)) {
        ++i;
    }
    // finding intermediate coeffs and variables
    let j = i - 1;
    let a = tFunc.y[j];
    let b = tFunc.x[j];
    let q = tFunc.x[i] - b;
    let r = x - b;
    let p = coeffs[i];
    let d = coeffs[i + 1];
    b = (tFunc.y[i] - a) / q - (d + 2 * p) * q / 3;
    d = (d - p) / q * r;
    let splineValue = a + r * (b + r * (p + d / 3));
    return splineValue;
}

function calculateParabolicSplineCoeffs(tFunc: TabulatedFunction): { a: number[], b: number[], c: number[] } {
    const n: number = tFunc.x.length - 1;
    /*
    length of these arrays equals to tab func length in order to
    have a map between math formulas and these calculations.
    So that first element of each array is unused and therefore undefined
    */
    let a: number[] = new Array(n + 1);
    let b: number[] = new Array(n + 1);
    let c: number[] = new Array(n + 1);

    let h: number[] = [];
    let g: number[] = [];

    for (let i = 1; i <= n; ++i) {
        h[i] = tFunc.x[i] - tFunc.x[i - 1];
    }

    for (let i = 1; i <= n; ++i) {
        g[i] = (tFunc.y[i - 1] - tFunc.y[i]) / h[i];
    }

    c[n] = g[n] / h[n];
    for (let i = n - 1; 1 <= i; --i) {
        c[i] = (g[i] - c[i + 1] * h[i + 1]) / h[i];
    }

    for (let i = n; 1 <= i; --i) {
        b[i] = ((tFunc.y[i] - tFunc.y[i - 1]) / h[i]) - h[i] * c[i];
    }

    for (let i = 1; i <= n; ++i) {
        a[i] = tFunc.y[i - 1];
    }

    return {
        a: a,
        b: b,
        c: c
    }
}

function calculateParabolicSpline(tFunc: TabulatedFunction, x: number, coeffs: { a: number[], b: number[], c: number[] }): number {
    let n = tFunc.x.length;
    let i = 1;
    // finding a near node number
    while ((tFunc.x[i] < x) && (i !== n)) {
        ++i;
    }
    return coeffs.a[i] + coeffs.b[i] * (x - tFunc.x[i - 1]) + coeffs.c[i] * <number>pow((x - tFunc.x[i - 1]), 2);
}

// main function
(() => {
    const from = 0;
    const to = 3.5;
    const partition = 4;
    const tabFunc = tabulateFunction(func, from, to, partition);

    const cubicSplineCoeffs = calculateCubicSplineCoeffs(tabFunc);
    const parabolicSplineCoeffs = calculateParabolicSplineCoeffs(tabFunc);

    funcAndSplinesPlot(plotOptions(
        "Function and Splines",
        plotElem("func-and-splines-plot"),
        {domain: [from, to]},
        {domain: [80, 125]},
        {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateLinearSpline(tabFunc, scope.x),
            range: [from, to]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateCubicSpline(tabFunc, scope.x, cubicSplineCoeffs),
            range: [from, to]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateParabolicSpline(tabFunc, scope.x, parabolicSplineCoeffs),
            range: [from, to]
        }, {
            // @ts-ignore
            fn: simplify(func, {pi: pi}).toString(),
            range: [from, to]
        },
    ));

    splineErrorsPlot(plotOptions(
        "Spline Errors",
        plotElem("spline-errors-plot"),
        {domain: [from, to]},
        {domain: [-1e-3, 4e-2]},
        {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => abs(calculateLinearSpline(tabFunc, scope.x) - evaluate(func, {x: scope.x})),
            range: [from, to]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => abs(calculateCubicSpline(tabFunc, scope.x, cubicSplineCoeffs) - evaluate(func, {x: scope.x})),
            range: [from, to]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => abs(calculateParabolicSpline(tabFunc, scope.x, parabolicSplineCoeffs) - evaluate(func, {x: scope.x})),
            range: [from, to]
        }
    ));

})();
