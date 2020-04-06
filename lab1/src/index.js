import d3 from "d3";
import {derivative, inv, det, evaluate, multiply, subtract} from "mathjs";
window.d3 = d3;

const EPSILON = 1e-3;
const func = "x^3 + 0.3*(x^2) - 5.7*x + 2.2";

const functionPlot = require("function-plot");
const plot = document.getElementsByClassName("plot")[0];
const plotOptions = {
    width: 600,
    height: 400,
    target: plot,
    tip: {
        renderer: function() {}
    },
    grid: true,
    data: [
        {
            fn: func,
        }
    ]
};

function findFuncValueOf(x) {
    return evaluate(func, {x: x});
}

function findNextIterationX(x, h) {
    const funcValueOfX = findFuncValueOf(x);
    return x - ((funcValueOfX * h) / (findFuncValueOf(x + h) - funcValueOfX))
}

function solveByBisectionMethod(leftBorder, rightBorder, iteration) {
    iteration = iteration ? ++iteration : 1;
    let currentPoint = 0.5*(leftBorder + rightBorder);
    if (rightBorder - leftBorder < 2*EPSILON) {
        const solution = currentPoint;
        const error = findFuncValueOf(solution);
        return {
            "solution": solution,
            "iterations-total": iteration,
            "error": error
        };
    }
    let funcValueInCurrentPoint = findFuncValueOf(currentPoint);
    if (funcValueInCurrentPoint === 0) {
        const solution = currentPoint;
        const error = findFuncValueOf(solution);
        return {
            "solution": solution,
            "iterations-total": iteration,
            "error": error
        };
    }
    let funcValueInLeftBorder = findFuncValueOf(leftBorder);
    if (funcValueInLeftBorder*funcValueInCurrentPoint < 0) {
        return solveByBisectionMethod(leftBorder, currentPoint, iteration);
    } else {
        return solveByBisectionMethod(currentPoint, rightBorder, iteration);
    }
}

function solveByNewtonMethod(x0) {
    let currentIterationX = x0;
    let nextIterationX;
    let absoluteDifferenceCurrentXAndNextX;

    /*
    h and delta is needed for more precise approximation.
    their values should be given in a random order from 0 to 1
     */
    let h = 0.5;
    let delta = 0.5;

    let iteration = 0;

    do {
        ++iteration;
        nextIterationX = findNextIterationX(currentIterationX, h);
        absoluteDifferenceCurrentXAndNextX = Math.abs(currentIterationX - nextIterationX);
        h *= delta;
        currentIterationX = nextIterationX;
    } while(Math.max(absoluteDifferenceCurrentXAndNextX) > EPSILON);

    const solution = currentIterationX;
    const error = findFuncValueOf(solution);

    return {
        "solution": solution,
        "iterations-total": iteration,
        "error": error
    };
}

function initBisection() {
    const leftBorder = document.getElementsByClassName("input-left")[0].value;
    const rightBorder = document.getElementsByClassName("input-right")[0].value;

    const bisectionMethod = solveByBisectionMethod(Number.parseFloat(leftBorder), Number.parseFloat(rightBorder));

    document.getElementById("bisection-solution").innerHTML = bisectionMethod["solution"].toFixed(6).toString();
    document.getElementById("bisection-error").innerHTML = bisectionMethod["error"].toString();
    document.getElementById("bisection-iterations-total").innerHTML = bisectionMethod["iterations-total"].toString();
}

function initNewton() {
    const x0 = document.getElementsByClassName("input-x0")[0].value;

    const newtonMethod = solveByNewtonMethod(Number.parseFloat(x0));

    document.getElementById("newton-solution").innerHTML = newtonMethod["solution"].toFixed(6).toString();
    document.getElementById("newton-error").innerHTML = newtonMethod["error"].toString();
    document.getElementById("newton-iterations-total").innerHTML = newtonMethod["iterations-total"].toString();
}

const initBisectionButton = document.getElementsByClassName("init-bisection-button")[0];
initBisectionButton.addEventListener('click', initBisection);

const initNewtonButton = document.getElementsByClassName("init-newton-button")[0];
initNewtonButton.addEventListener('click', initNewton);

functionPlot(plotOptions);
