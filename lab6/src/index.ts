import d3 from "d3";
import {abs, max} from "mathjs";

window.d3 = d3;

const plot = require("function-plot");

interface TabulatedFunction {
    x: number[];
    y: number[];
}

function tabulateFunction(f: Function, from: number, to: number, partition: number): TabulatedFunction {
    if (to < from) {
        to = [from, from = to][0]; // swap
    }
    let xCurrent = from;
    let partLength = (to - from) / partition;
    let tableFunction: TabulatedFunction = {x: [], y: []};
    while (xCurrent <= to + partLength / 2) {
        tableFunction.x.push(xCurrent);
        tableFunction.y.push(f(xCurrent));
        xCurrent += partLength;
    }
    return tableFunction;
}

function transformToPoints(tf: TabulatedFunction): number[][] {
    let points: number[][] = [];
    for (let i = 0; i < tf.x.length; ++i) {
        points.push([tf.x[i], tf.y[i]]);
    }
    return points;
}

function pushToOutput(...records: any[]): void {
    records.map((elem) => elem.toString());
    let outputBlocks = document.getElementsByClassName("input-output");
    let lastOutputBlock = outputBlocks[outputBlocks.length - 1];
    lastOutputBlock.insertAdjacentHTML("beforeend", "<div class=\"output-block\">" + records.join('\n') + "</div>");
}

function generateTable(title: string, headers: any[], ...columns: any[]) {
    let tables = document.getElementsByClassName("input-output");
    let lastTable = tables[tables.length - 1];
    let tableBody = "";
    tableBody += "<tr>";
    for (let headerIndex = 0; headerIndex < headers.length; ++headerIndex) {
        tableBody += "<th>" + headers[headerIndex] + "</th>"
    }
    tableBody += "</tr>";
    for (let rowIndex = 0; rowIndex < max(columns.map(column => column.length)); ++rowIndex) {
        tableBody += "<tr>";
        for (let columnIndex = 0; columnIndex < columns.length; ++columnIndex) {
            tableBody += `<td>${columns[columnIndex][rowIndex]}</td>`;
        }
        tableBody += "</tr>";
    }
    lastTable.insertAdjacentHTML("beforeend",
        "<div class='table-block'><h3 class='table-block__title'>" + title + "</h3><table class='table-block__table'>" + tableBody + "</table></div>"
    );
}

function findNextY(f: Function, x: number, y: number, h: number): number {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + k1 * h / 2);
    const k3 = f(x + h / 2, y + k2 * h / 2);
    const k4 = f(x + h, y + k3 * h);
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

function tabulateRungeKutta(f: Function, x0: number, xn: number, y0: number, h: number): TabulatedFunction {
    let rungeKutta: TabulatedFunction = {x: [], y: []};
    rungeKutta.x[0] = x0;
    rungeKutta.y[0] = y0;
    const n = 1 + (xn - x0) / h;
    for (let i = 0; i <= n - 2; ++i) {
        rungeKutta.y[i + 1] = findNextY(f, rungeKutta.x[i], rungeKutta.y[i], h);
        rungeKutta.x[i + 1] = rungeKutta.x[i] + h;
    }
    return rungeKutta;
}

function tabulateEuler(f: Function, x0: number, xn: number, y0: number, h: number): TabulatedFunction {
    let euler: TabulatedFunction = {x: [], y: []};
    for (let xCurrent = x0, yCurrent = y0; xCurrent <= xn + h / 2; xCurrent += h, yCurrent += h * f(xCurrent, yCurrent)) {
        euler.x.push(xCurrent);
        euler.y.push(yCurrent);
    }
    return euler;
}

function findDelta(singleStepFunc: TabulatedFunction, doubleStepFunc: TabulatedFunction): number {
    let deltas: number[] = [];
    for (let i = 0; i < doubleStepFunc.x.length; ++i) {
        const areNodesEqual: boolean = abs(singleStepFunc.x[2*i] - doubleStepFunc.x[i]) < 1e-4;
        if (areNodesEqual) {
            deltas.push(abs(singleStepFunc.y[2*i] - doubleStepFunc.y[i]))
        }
    }
    return max(deltas);
}

// main function
(() => {
    const f: Function = (x: number, y: number) => (2 / (x ** 2)) - (y ** 2);
    const y: Function = (x: number) => (4 * (x ** 3) - 1) / (x * (1 + 2 * (x ** 3)));

    const h: number = 0.05;
    const x0 = 1;
    const xn = 2;
    const y0 = 1;
    const headers = ['x', 'y'];

    let rungeKutta: TabulatedFunction = tabulateRungeKutta(f, x0, xn, y0, h);
    generateTable('Runge-Kutta', headers, rungeKutta.x, rungeKutta.y);

    let rungeKuttaDoubleH: TabulatedFunction = tabulateRungeKutta(f, x0, xn, y0, 2*h);
    const rungeKuttaDelta: number = findDelta(rungeKutta, rungeKuttaDoubleH);
    pushToOutput('&Delta;(Runge-Kutta) =', rungeKuttaDelta);

    let euler: TabulatedFunction = tabulateEuler(f, x0, xn, y0, h);
    generateTable('Euler', headers, euler.x, euler.y);

    let eulerDoubleH: TabulatedFunction = tabulateEuler(f, x0, xn, y0, 2*h);
    const eulerDelta: number = findDelta(euler, eulerDoubleH);
    pushToOutput('&Delta;(Euler) =', eulerDelta);

    let preciseSolution: TabulatedFunction = tabulateFunction(y, x0, xn, (xn - x0) / h);
    generateTable('Precise solution', headers, preciseSolution.x, preciseSolution.y);

    plot({
        target: '#plot',
        grid: true,
        xAxis: {domain: [0.6, 3.4]},
        yAxis: {domain: [-0.5, 2.5]},
        data: [{
            points: transformToPoints(rungeKutta),
            fnType: 'points',
            graphType: 'polyline'
        }, {
            points: transformToPoints(euler),
            fnType: 'points',
            graphType: 'polyline'
        }, {
            graphType: 'polyline',
            fn: (scope: { x: any; }) => y(scope.x),
            range: [x0, xn]
        }]
    })
})();
