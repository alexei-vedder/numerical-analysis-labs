import {abs, evaluate} from "mathjs";

function pushToOutput(...records: any[]): void {
    records.map((elem) => elem.toString());
    let outputBlocks = document.getElementsByClassName("input-output");
    let lastOutputBlock = outputBlocks[outputBlocks.length - 1];
    lastOutputBlock.insertAdjacentHTML("beforeend", "<div class=\"output-block\">" + records.join('\n') + "</div>");
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

/*
// another version of a Simpson method implementation
function calcSimpson(func: Function, from: number, to: number, step: number) {
    let i;
    let n = ~~((to - from) / step);
    let n2 = n * 2;
    let h = (to - from) / n2;
    let sum = func(from) + func(to);

    for (i = 1; i < n2; i += 2) {
        sum += 4 * func(from + i * h)
    }

    for (i = 2; i < n2 - 1; i += 2) {
        sum += 2 * func(from + i * h)
    }

    return sum * h / 3
}
*/

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

function calcNewtonLeibniz(func: Function, from: number, to: number): number {
    const antiderivative: Function = (x: number) => evaluate("(2*(x^(3/2)) * (-2 + 3*log(x)))/9", {x: x});
    return antiderivative(to) - antiderivative(from);
}

// main function
(() => {
    const func: Function = (x: number) => evaluate("sqrt(x)*log(x)", {x: x});
    const from: number = 1;
    const to: number = 3;
    const step: number = .1

    const trapeziaSolutionH: number = calcTrapezia(func, from, to, step);
    const trapeziaSolution2H: number = calcTrapezia(func, from, to, 2 * step);
    const trapeziaError: number = abs(trapeziaSolutionH - trapeziaSolution2H) / 3;
    pushToOutput("Trapezia Solution with 'h' step: ", trapeziaSolutionH);
    pushToOutput("Trapezia Solution with '2h' step: ", trapeziaSolution2H);
    pushToOutput("Error: ", trapeziaError);

    const simpsonSolutionH: number = calcSimpson(func, from, to, step);
    const simpsonSolution2H: number = calcSimpson(func, from, to, 2 * step);
    const simpsonError: number = abs(simpsonSolutionH - simpsonSolution2H) / 15;
    pushToOutput("Simpson Solution with 'h' step:", simpsonSolutionH);
    pushToOutput("Simpson Solution with '2h' step:", simpsonSolution2H);
    pushToOutput("Error:", simpsonError);

    const newtonLeibnizSolution: number = calcNewtonLeibniz(func, from, to);
    pushToOutput("Newton-Leibniz Solution:", newtonLeibnizSolution);
})();
