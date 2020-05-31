import d3 from "d3";
import {max} from "mathjs";

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

function getPoints(tf: TabulatedFunction): number[][] {
    let points: number[][] = [];
    for (let i = 0; i < tf.x.length; ++i) {
        points.push([tf.x[i], tf.y[i]]);
    }
    return points;
}

function findNextY(f: Function, x: number, y: number, h: number): number {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + k1 * h / 2);
    const k3 = f(x + h / 2, y + k2 * h / 2);
    const k4 = f(x + h, y + k3 * h);
    return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

function generateTable(title: string, headers: any[], ...columns: any[]) {
    let tables = document.getElementsByClassName("table-wrapper");
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
        "<div class='table'><h3 class='table__title'>" + title + "</h3><table class='table__main'>" + tableBody + "</table></div>"
    );
}

// main function
(() => {
    const f: Function = (x: number, y: number) => (2 / (x ** 2)) - (y ** 2);
    const y: Function = (x: number) => (4*(x**3) - 1) / (x*(1 + 2*(x**3)));

    const h: number = 0.2;
    const x0 = 1;
    const xn = 3;
    const y0 = 1;
    const n = 1 + (xn - x0) / h;
    const headers = ['x', 'y'];

    let rungeKutta: TabulatedFunction = {x: [], y: []};
    rungeKutta.x[0] = x0;
    rungeKutta.y[0] = y0;
    for (let i = 0; i <= n - 2; ++i) {
        rungeKutta.y[i + 1] = findNextY(f, rungeKutta.x[i], rungeKutta.y[i], h);
        rungeKutta.x[i + 1] = rungeKutta.x[i] + h;
    }

    generateTable('Runge-Kutta', headers, rungeKutta.x, rungeKutta.y);

    let euler: TabulatedFunction = {x: [], y: []};
    for (let xCurrent = x0, yCurrent = y0; xCurrent <= xn + h/2; xCurrent += h, yCurrent += h * f(xCurrent, yCurrent)) {
        euler.x.push(xCurrent);
        euler.y.push(yCurrent);
    }

    generateTable('Euler', headers, euler.x, euler.y);

    let preciseSolution: TabulatedFunction = tabulateFunction(y, x0, xn, n-1);

    generateTable('Precise solution', headers, preciseSolution.x, preciseSolution.y);

    plot({
        target: '#plot',
        grid: true,
        xAxis: {domain: [0.6, 3.4]},
        yAxis: {domain: [-0.5, 2.5]},
        data: [{
            points: getPoints(rungeKutta),
            fnType: 'points',
            graphType: 'polyline'
        }, {
            points: getPoints(euler),
            fnType: 'points',
            graphType: 'polyline'
        }, {
            graphType: 'polyline',
            fn: (scope: { x: any; }) => y(scope.x),
            range: [x0, xn]
        }]
    })

})();
