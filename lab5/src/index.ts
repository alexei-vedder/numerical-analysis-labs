import {abs, evaluate} from "mathjs";

function pushToOutput(...records: any[]): void {
    records.map((elem) => elem.toString());
    let outputBlocks = document.getElementsByClassName("input-output");
    let lastOutputBlock = outputBlocks[outputBlocks.length - 1];
    lastOutputBlock.insertAdjacentHTML("beforeend", "<div class=\"output-block\">" + records.join('\n') + "</div>");
}

/*
This method needs for checking if there are number of ranges is multiply of 4
 */
function correctStep(from: number, to: number, step: number): number {
    let rangesNum = (to - from) / step;
    let remainder = rangesNum % 4;
    if (remainder === 0) {
        return step;
    } else {
        rangesNum -= remainder;
        return (to - from) / rangesNum;
    }
}

function tabulateRange(from: number, to: number, step: number): number[] {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }

    let tabulation: number[] = [];
    for (let xCurrent = from; xCurrent < to; xCurrent += step) {
        tabulation.push(xCurrent);
    }

    tabulation.push(to);
    return tabulation;
}

function calcTrapezia(func: Function, from: number, to: number, step: number): number {
    let x: number[] = tabulateRange(from, to, step);
    let solution: number = 0;
    for (let i = 0; i < x.length - 1; ++i) {
        solution += (func(x[i]) + func(x[i + 1])) * (x[i + 1] - x[i]) / 2
    }
    return solution;
}

function calcSimpson(func: Function, from: number, to: number, step: number): number {
    let x: number[] = tabulateRange(from, to, step);
    let n: number = x.length - 1;
    let series1: number = 0;
    for (let j = 2; j <= n - 1; j += 2) {
        series1 += func(x[j]);
    }
    let series2: number = 0;
    for (let j = 1; j < n; j += 2) {
        series2 += func(x[j]);
    }
    return (step / 3) * (func(x[0]) + 2*series1 + 4*series2 + func(x[n]));
}

function calcNewtonLeibniz(antiderivative: Function, from: number, to: number): number {
    return antiderivative(to) - antiderivative(from);
}

// main function
(() => {
    const func: Function = (x: number) => evaluate("sqrt(x)*log(x)", {x: x});
    const antiderivative: Function = (x: number) => evaluate("(2*(x^(3/2)) * (-2 + 3*log(x)))/9", {x: x});
    const from: number = 1;
    const to: number = 3;
    const step: number = correctStep(from, to, 0.1)
    const doubleStep: number = correctStep(from, to, 0.1 * 2)

    const trapeziaSolutionH: number = calcTrapezia(func, from, to, step);
    const trapeziaSolution2H: number = calcTrapezia(func, from, to, doubleStep);
    const trapeziaError: number = abs(trapeziaSolutionH - trapeziaSolution2H) / 3;
    pushToOutput("Trapezia Solution with 'h' step: ", trapeziaSolutionH);
    pushToOutput("Trapezia Solution with '2h' step: ", trapeziaSolution2H);
    pushToOutput("Error: ", trapeziaError);

    const simpsonSolutionH: number = calcSimpson(func, from, to, step);
    const simpsonSolution2H: number = calcSimpson(func, from, to, doubleStep);
    const simpsonError: number = abs(simpsonSolutionH - simpsonSolution2H) / 15;
    pushToOutput("Simpson Solution with 'h' step:", simpsonSolutionH);
    pushToOutput("Simpson Solution with '2h' step:", simpsonSolution2H);
    pushToOutput("Error:", simpsonError);

    const newtonLeibnizSolution: number = calcNewtonLeibniz(antiderivative, from, to);
    pushToOutput("Newton-Leibniz Solution:", newtonLeibnizSolution);
})();
