import d3 from "d3";
import {abs, derivative, evaluate, random, simplify, pi, factorial} from "mathjs";

window.d3 = d3;

const func: string = "8*pi*(sqrt(12 + pi*x))";
const fourthDerivation: string = derivative(derivative(derivative(derivative(
    // @ts-ignore
    simplify(func, {pi: pi}).toString(),
    "x"), "x"), "x"), "x").toString();

const EPS = 1e-4;

const justFuncPlot = require("function-plot");
const fourthDerFuncPlot = require("function-plot");
const lagrangeAndNewtonFuncPlot = require("function-plot");
const errorFuncPlot = require("function-plot");

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

enum FuncFindingType {
    'standard',
    'lagrange',
    'newton'
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

function interpolateLagrange(tabFunc: TabulatedFunction, x: number): number {

    tabFunc.nodes.map((xi, index) => {
        if (abs(xi - x) < EPS) {
           return tabFunc.values[index];
        }
    });

    let solution: number = 0;
    for (let i = 0; i < tabFunc.nodes.length; ++i) {
        let s = 1;
        for (let j = 0; j < tabFunc.nodes.length; ++j) {
            if (i !== j) {
                s = s*(x - tabFunc.nodes[j]) / (tabFunc.nodes[i] - tabFunc.nodes[j]);
            }
        }
        solution = solution + tabFunc.values[i]*s;
    }

    return solution;
}

function interpolateNewton(tabFunc: TabulatedFunction, x: number): number {
    let y1 = [0, 0, 0];
    let y2 = [0, 0];
    let y3 = [0];

    for (let i = 0; i < y1.length; ++i) {
        y1[i] = (tabFunc.values[i + 1] - tabFunc.values[i]) / (tabFunc.nodes[i + 1] - tabFunc.nodes[i]);
    }

    for (let i = 0; i < y2.length; ++i) {
        y2[i] = (y1[i + 1] - y1[i]) / (tabFunc.nodes[i + 2] - tabFunc.nodes[i]);
    }

    for (let i = 0; i < y3.length; ++i) {
        y3[i] = (y2[i + 1] - y2[i]) / (tabFunc.nodes[i + 3] - tabFunc.nodes[i]);
    }

    return  tabFunc.values[0] +
        y1[0]*(x - tabFunc.nodes[0]) +
        y2[0]*(x - tabFunc.nodes[0])*(x - tabFunc.nodes[1]) +
        y3[0]*(x - tabFunc.nodes[0])*(x - tabFunc.nodes[1])*(x - tabFunc.nodes[2]);
}

function calculatePolynomial(tabFunc: TabulatedFunction): number[] {
    let lVector: number[] = [];
    for (let i = 0; i < tabFunc.nodes.length; ++i) {
        let l1 = tabFunc.values[0]*(
            (tabFunc.nodes[i] - tabFunc.nodes[1]) / (tabFunc.nodes[0] - tabFunc.nodes[1]) *
            (tabFunc.nodes[i] - tabFunc.nodes[2]) / (tabFunc.nodes[0] - tabFunc.nodes[2]) *
            (tabFunc.nodes[i] - tabFunc.nodes[3]) / (tabFunc.nodes[0] - tabFunc.nodes[3])
        );
        let l2 = tabFunc.values[1]*(
            (tabFunc.nodes[i] - tabFunc.nodes[0]) / (tabFunc.nodes[1] - tabFunc.nodes[0]) *
            (tabFunc.nodes[i] - tabFunc.nodes[2]) / (tabFunc.nodes[1] - tabFunc.nodes[2]) *
            (tabFunc.nodes[i] - tabFunc.nodes[3]) / (tabFunc.nodes[1] - tabFunc.nodes[3])
        );
        let l3 = tabFunc.values[2]*(
            (tabFunc.nodes[i] - tabFunc.nodes[0]) / (tabFunc.nodes[2] - tabFunc.nodes[0]) *
            (tabFunc.nodes[i] - tabFunc.nodes[1]) / (tabFunc.nodes[2] - tabFunc.nodes[1]) *
            (tabFunc.nodes[i] - tabFunc.nodes[3]) / (tabFunc.nodes[2] - tabFunc.nodes[3])
        );
        let l4 = tabFunc.values[3]*(
            (tabFunc.nodes[i] - tabFunc.nodes[0]) / (tabFunc.nodes[3] - tabFunc.nodes[0]) *
            (tabFunc.nodes[i] - tabFunc.nodes[1]) / (tabFunc.nodes[3] - tabFunc.nodes[1]) *
            (tabFunc.nodes[i] - tabFunc.nodes[2]) / (tabFunc.nodes[3] - tabFunc.nodes[2])
        );
        lVector.push(l1 + l2 + l3 + l4);
    }
    return lVector;
}

function calculateOmega(tabFunc: TabulatedFunction, x: number): number {
    let omega: number = 1;
    tabFunc.nodes.forEach((xi: number) => {omega *= (x - xi)});
    return abs(omega);
}

function calculateError(tabFunc: TabulatedFunction, x: number, type?: FuncFindingType): number {
    let n: number = tabFunc.nodes.length - 1;
    let funcMaxNode: number = tabFunc.nodes[n];
    let m: number = evaluate(fourthDerivation,{x: funcMaxNode});
    let factorialResult = factorial(n + 1);
    let omega = calculateOmega(tabFunc, x);
    let p: number = (m * omega) / factorialResult;
    let error: number;
    switch (type) {
        case FuncFindingType.lagrange: {
            error = abs(p / interpolateLagrange(tabFunc, x));
            break;
        }
        case FuncFindingType.newton: {
            error = abs(p / interpolateNewton(tabFunc, x));
            break;
        }
        default: {
            error = abs(p / evaluate(func, {x: x}));
            break;
        }
    }
    return error;
}

function getNValuableRange(tabFunc: TabulatedFunction, epsilon: number, partition: number): number[] {
    let partLength: number;
    let errorTabFunc: TabulatedFunction = {
        nodes: tabFunc.nodes,
        values: new Array(tabFunc.values.length)
    };
    errorTabFunc.values.map((value: number, index: number) => calculateError(tabFunc, tabFunc.nodes[index]));
    // let newRange: number[] = [];
    while (errorTabFunc.values.some((value) => epsilon <= value)) {
        let xCurrent = errorTabFunc.nodes[0] += 100*epsilon;
        errorTabFunc.nodes[errorTabFunc.nodes.length - 1] -= 100*epsilon;

        partLength = (errorTabFunc.nodes[errorTabFunc.nodes.length - 1] - errorTabFunc.nodes[0]) / partition;
        errorTabFunc.nodes.forEach((node: number, index: number) => {
            errorTabFunc.nodes[index] = xCurrent;
            xCurrent += partLength;
        });
        errorTabFunc.values.map((value, index) => calculateError(
            tabulateFunction(func, errorTabFunc.nodes[0], errorTabFunc.nodes[errorTabFunc.nodes.length - 1], partition),
            tabFunc.nodes[index])
        );
    }
    return [errorTabFunc.nodes[0], errorTabFunc.nodes[errorTabFunc.nodes.length - 1]];
}

function tabulateMovedFunction(func: string, from: number, to: number, partition: number): TabulatedFunction {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }

    let partLength = (to - from) / partition;
    let xCurrent = from + partLength/2;

    let tableFunction: TabulatedFunction = {nodes: [], values: []};
    while (xCurrent <= to) {
        tableFunction.nodes.push(xCurrent);
        tableFunction.values.push(evaluate(func, {x: xCurrent}));
        xCurrent += partLength;
    }
    return tableFunction;
}

// main function
(() => {
    const leftBorder: number = 0;
    const rightBorder: number = 3.5;
    const partition: number = 4;
    const tabulatedFunction: TabulatedFunction = tabulateFunction(func, leftBorder, rightBorder, partition);
    const movedTabulatedFunction: TabulatedFunction = tabulateMovedFunction(func, leftBorder, rightBorder, partition);
    const x = random(leftBorder, rightBorder);
    const lagrangeSolution: number = interpolateLagrange(tabulatedFunction, x);
    const newtonSolution: number = interpolateNewton(tabulatedFunction, x);

    pushToOutput("Randomized x:", x);
    pushToOutput("Function value:", evaluate(func, {x: x}));
    pushToOutput("Lagrange solution:", lagrangeSolution);
    pushToOutput("Newton solution:", newtonSolution);

    /*fourthDerFuncPlot(plotOptions(
        "4th derivation",
        plotElem("fourth-der-func-plot"),
        {
            fn: fourthDerivation,
            range: [leftBorder, rightBorder]
        }
    ));*/

    calculatePolynomial(tabulatedFunction)
        .forEach((element, index) => pushToOutput("Lagrange polynomial (", index, ")", element));

    lagrangeAndNewtonFuncPlot(plotOptions(
        "function, Lagrange and Newton",
        plotElem("lagrange-and-newton-func-plot"),
        {domain: [0, 3.5]},
        {domain: [80, 120]},
        {
            // @ts-ignore
            fn: simplify(func, {pi: pi}).toString(),
            range: [leftBorder, rightBorder]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => interpolateLagrange(tabulatedFunction, scope.x),
            range: [leftBorder, rightBorder]
        },{
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => interpolateNewton(tabulatedFunction, scope.x),
            range: [leftBorder, rightBorder]
        }
    ));

    pushToOutput("Error:", calculateError(tabulatedFunction, x, FuncFindingType.standard));
    pushToOutput("Lagrange error:", calculateError(tabulatedFunction, x, FuncFindingType.lagrange));
    pushToOutput("Newton error:", calculateError(tabulatedFunction, x, FuncFindingType.newton));

    errorFuncPlot(plotOptions(
        "Errors",
        plotElem("error-func-plot"),
        {domain: [0, 3.5]},
        {domain: [-0.00001, 0.00002]},
        {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateError(movedTabulatedFunction, scope.x, FuncFindingType.standard),
            range: [leftBorder, rightBorder]
        }, /*{
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateOmega(movedTabulatedFunction, scope.x, FuncFindingType.lagrange),
            range: [leftBorder, rightBorder]
        }, {
            graphType: 'polyline',
            // @ts-ignore
            fn: scope => calculateOmega(movedTabulatedFunction, scope.x, FuncFindingType.newton),
            range: [leftBorder, rightBorder]
        }*/
    ));

    let newRange = getNValuableRange(tabulatedFunction, EPS, partition);
    let newLeftBorder: number = newRange[0];
    let newRightBorder: number = newRange[1];
    let newTabulatedFunction: TabulatedFunction = tabulateFunction(func, newRange[0], newRange[1], partition);
    let newX = random(newLeftBorder, newRightBorder);
    let newError: number = calculateError(newTabulatedFunction, newX);

    pushToOutput("Randomized x:", newX);
    pushToOutput("4-valuable digits range error:", newError);
})();
