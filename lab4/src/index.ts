import d3 from "d3";
import {evaluate, simplify, pi} from "mathjs";

window.d3 = d3;

const func: string = "8*pi*(sqrt(12 + pi*x))";

// const EPS = 1e-4;

const funcAndSplinesPlot = require("function-plot");
//const splineErrorsPlot = require("function-plot");

const plotElem = (id: string) => {
    return document.getElementById(id);
};

const plotOptions = (title: string, target: HTMLElement | null, xAxis: {}, yAxis: {}, ...data: Object[]) => {
    return {
        title: title,
        width: 400,
        height: 270,
        target: target,
        xAxis: xAxis,
        yAxis: yAxis,
        tip: {
            renderer: () => {}
        },
        grid: true,
        data: data
    }
};

interface TabulatedFunction {
    nodes: number[];
    values: number[];
}

function pushToOutput(...records: any[]): void {
    records.map((elem) => elem.toString());
    setTimeout(() => {
        let outputBlocks = document.getElementsByClassName("input-output");
        let lastOutputBlock = outputBlocks[outputBlocks.length - 1];
        lastOutputBlock.insertAdjacentHTML("beforeend", "<div class=\"output-block\">" + records.join('\n') + "</div>");
    }, 2000);
}

function tabulateFunction(func: string, from: number, to: number, partition: number): TabulatedFunction {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }

    let xCurrent = from;
    let partLength = (to - from) / partition;
    let tableFunction: TabulatedFunction = {nodes: [], values: []};
    while (xCurrent <= to) {
        tableFunction.nodes.push(xCurrent);
        tableFunction.values.push(evaluate(func, {x: xCurrent}));
        xCurrent += partLength;
    }
    return tableFunction;
}

function calculateLinearSpline(tabFunc: TabulatedFunction, x: number): number {
    let solution: number = 0;
    for (let i = 0; i < tabFunc.nodes.length; ++i) {
        let l: number = 1;
        for (let j = 0; j < tabFunc.nodes.length; ++j) {
            if (i !== j) {
                l *= (x - tabFunc.nodes[j]) / (tabFunc.nodes[i] - tabFunc.nodes[j])
            }
        }
        solution += (tabFunc.values[i]*l);
    }
    return solution;
}

function calculateCubicSplineCoeffs(tabFunc: TabulatedFunction): number[] {
    const n = tabFunc.nodes.length;

    let k: number[] = new Array(n + 1).fill(0);
    let c: number[] = new Array(n + 1).fill(0);

    for(let i = 2; i < n; ++i) {
        let j: number = i - 1;
        let m: number = j - 1;
        let a: number = tabFunc.nodes[i] - tabFunc.nodes[j];
        let b: number = tabFunc.nodes[j] - tabFunc.nodes[m];
        let r: number = 2*(a + b) - b*c[j];
        c[i] = a / r;
        k[i] = (3 * ((tabFunc.values[i] - tabFunc.values[j]) / a - (tabFunc.values[j] - tabFunc.values[m]) / b) - b * k[j]) / r;
    }
    c[n] = k[n];
    for (let i = n - 1; 2 <= i; --i) {
        c[i] = k[i] - c[i] * c[i + 1]
    }
    return c;
}

function calculateCubicSpline(tabFunc: TabulatedFunction, x: number, coeffs: number[]): number {
    const n = tabFunc.nodes.length;

    let i = 1;
    // finding a near node number
    while((tabFunc.nodes[i] < x) && (i !== n)) {
        ++i;
    }
    // finding intermediate coeffs and variables
    let j = i - 1;
    let a = tabFunc.values[j];
    let b = tabFunc.nodes[j];
    let q = tabFunc.nodes[i] - b;
    let r = x - b;
    let p = coeffs[i];
    let d = coeffs[i + 1];
    b = (tabFunc.values[i] - a) / q - (d + 2*p) * q/3;
    d = (d - p) / q * r;
    /*
    let firstSplineDerivation = b + r*(2*p + d);
    let secondSplineDerivation = 2*(p + d);
    */
    let splineValue = a + r*(b + r*(p + d/3));
    return splineValue;
}

function calculateParabolicSpline() {
}

// main function
// 2 рисунка. На первом - функция и все три сплайна. На втором - абсолютные погрешности трёх сплайнов
(() => {
    const from = 0;
    const to = 3.5;
    const partition = 4;
    const tabFunc = tabulateFunction(func, from, to, partition);

    const cubicSplineCoeffs = calculateCubicSplineCoeffs(tabFunc);

    pushToOutput(cubicSplineCoeffs);

    funcAndSplinesPlot(plotOptions(
        "Function and Splines",
        plotElem("func-and-splines-plot"),
        {domain: [from, to]},
        {domain: [80, 120]},
        {
            // @ts-ignore
            fn: simplify(func, {pi: pi}).toString(),
            range: [from, to]
        },
        {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateLinearSpline(tabFunc, scope.x),
            range: [from, to]
        },
        {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateCubicSpline(tabFunc, scope.x, cubicSplineCoeffs),
            range: [from, to]
        },
        /*{
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateParabolicSpline(tabFunc, scope.x),
            range: [from, to]
        }*/
    ));

})();
