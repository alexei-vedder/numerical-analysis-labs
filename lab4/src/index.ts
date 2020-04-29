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

interface Coeffs {
    a: number[];
    b: number[];
    c: number[];
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

function tabulateMovedFunction(func: string, from: number, to: number, partition: number): TabulatedFunction {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }

    let partLength = (to - from) / partition;
    let xCurrent = from + partLength/2;

    let tableFunction: TabulatedFunction = {x: [], y: []};
    while (xCurrent <= to) {
        tableFunction.x.push(xCurrent);
        tableFunction.y.push(evaluate(func, {x: xCurrent}));
        xCurrent += partLength;
    }
    return tableFunction;
}

function calculateLinearSpline(f: TabulatedFunction, x: number): number {
    let solution: number = 0;
    for (let i = 0; i < f.x.length; ++i) {
        let l: number = 1;
        for (let j = 0; j < f.x.length; ++j) {
            if (i !== j) {
                l *= (x - f.x[j]) / (f.x[i] - f.x[j])
            }
        }
        solution += (f.y[i] * l);
    }
    return solution;
}

function calculateCubicSplineCoeffs(f: TabulatedFunction): Coeffs {
    const n = f.x.length;
    let b: number[] = new Array(n).fill(0);
    let c: number[] = new Array(n).fill(0);
    let d: number[] = new Array(n).fill(0);
    let h: number[] = new Array(n).fill(0);
    for (let k = 1; k < n; ++k) {
        h[k] = f.x[k] - f.x[k-1];
    }
    let l: number[] = new Array(n).fill(0);
    for (let k = 1; k < n; ++k) {
        l[k] = (f.y[k] - f.y[k-1])/h[k];
    }
    let delta: number[] = new Array(n).fill(0);
    delta[1] = -h[3]/(2*(h[3] + h[2]));
    let lambda: number[] = new Array(n).fill(0);
    lambda[1] = 3*(l[3] - l[2])/(2*(h[3] + h[2]));
    for (let k = 3; k < n; ++k) {
        delta[k-1] = -h[k]/(2*(h[k-1] + h[k]) + h[k-1]*delta[k-2]);
        lambda[k-1] = (3*(l[k] - l[k-1]) - h[k-1]*lambda[k-2])/(2*(h[k-1] + h[k]) + h[k-1] - delta[k-2]);
    }
    c[n-1] = 0;
    for (let k = n-1; 2 <= k; --k) {
        c[k-1] = delta[k-1]*c[k] + lambda[k-1];
    }
    for (let k = 1; k < n; ++k) {
        d[k] = (c[k] - c[k-1])/(3*h[k]);
        b[k] = l[k] + (2*c[k]*h[k] + h[k]*c[k-1])/3;
    }
    return {
        a: b,
        b: c,
        c: d
    }
}

function calculateCubicSpline(f: TabulatedFunction, x: number, coeffs: Coeffs): number {
    const n = f.x.length;
    let b: number[] = coeffs.a;
    let c: number[] = coeffs.b;
    let d: number[] = coeffs.c;
    let a = f.y;
    let j = 0;
    if (f.x[n-2] < x) {
        j = n - 1;
    } else {
        for (let k = 1; k < n-1; ++k) {
            if (x <= f.x[k]) {
                j = k;
                break;
            }
        }
    }
    return a[j] + b[j] * (x - f.x[j]) + c[j]*(x - f.x[j])**2 + d[j]*(x - f.x[j])**3;
}

function calculateParabolicSplineCoeffs(f: TabulatedFunction): Coeffs {
    const n: number = f.x.length;

    let a: number[] = new Array(n).fill(0);
    let b: number[] = new Array(n).fill(0);
    let c: number[] = new Array(n).fill(0);

    let h: number[] = new Array(n).fill(0);
    let g: number[] = new Array(n).fill(0);

    for (let i = 1; i < n; ++i) {
        h[i] = f.x[i] - f.x[i - 1];
    }

    for (let i = 1; i < n; ++i) {
        g[i] = (f.y[i - 1] - f.y[i]) / h[i];
    }

    c[n-1] = g[n-1] / h[n-1];
    for (let i = n - 2; 1 <= i; --i) {
        c[i] = (g[i] - c[i + 1] * h[i + 1]) / h[i];
    }

    for (let i = n - 1; 1 <= i; --i) {
        b[i] = ((f.y[i] - f.y[i - 1]) / h[i]) - h[i] * c[i];
    }

    for (let i = 1; i < n; ++i) {
        a[i] = f.y[i - 1];
    }

    return {
        a: a,
        b: b,
        c: c
    }
}

function calculateParabolicSpline(f: TabulatedFunction, x: number, coeffs: Coeffs): number {
    let n = f.x.length;
    let i = 1;
    // finding a near node number
    while ((f.x[i] < x) && (i !== n - 1)) {
        ++i;
    }
    return coeffs.a[i] + coeffs.b[i]*(x - f.x[i - 1]) + coeffs.c[i] * (x - f.x[i - 1])**2;
}

// main function
(() => {
    const from = 0;
    const to = 3.5;
    const partition = 4;
    const tabFunc = tabulateMovedFunction(func, from, to, partition);

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
