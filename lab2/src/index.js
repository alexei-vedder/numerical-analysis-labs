import d3 from "d3";
import {derivative, inv, det, evaluate, multiply, subtract, isArray, isNumber} from "mathjs";
window.d3 = d3;

const EPSILON = 1e-5;
const vectorFunction = [
    ["sin(x + 0.5) - 1 - y"],
    ["x + cos(y - 2)"]
];

const jacobian = [
    [derivative(vectorFunction[0][0], 'x').toString(), derivative(vectorFunction[0][0], 'y').toString()],
    [derivative(vectorFunction[1][0], 'x').toString(), derivative(vectorFunction[1][0], 'y').toString()]
];

const functionPlot = require("function-plot");
const plot = document.getElementsByClassName("plot")[0];
const plotOptions = {
    width: 600,
    height: 500,
    target: plot,
    tip: {
        renderer: function() {}
    },
    grid: true,
    data: [
        {
            fn: vectorFunction[0][0],
            fnType: 'implicit'
        },
        {
            fn: vectorFunction[1][0],
            fnType: 'implicit'
        }
    ]
};

function findVectorFunctionInPoint(vector) {
    const f1 = evaluate(vectorFunction[0][0], {x: vector[0][0], y: vector[1][0]});
    const f2 = evaluate(vectorFunction[1][0], {x: vector[0][0], y: vector[1][0]});
    return [
        [f1],
        [f2]
    ]
}

function findInvertibleJacobianInPoint(vector) {
    const j11 = evaluate(jacobian[0][0], {x: vector[0][0], y: vector[1][0]});
    const j12 = evaluate(jacobian[0][1], {x: vector[0][0], y: vector[1][0]});
    const j21 = evaluate(jacobian[1][0], {x: vector[0][0], y: vector[1][0]});
    const j22 = evaluate(jacobian[1][1], {x: vector[0][0], y: vector[1][0]});
    return inv([
        [j11, j12],
        [j21, j22]
    ]);
}

function findNextIterationVector(vector, invertibleJacobianInPoint) {
    const vectorFunctionInPoint = findVectorFunctionInPoint(vector);
    return subtract(vector, multiply(invertibleJacobianInPoint, vectorFunctionInPoint));
}

function solveByNewtonMethod(x0, y0) {

    let currentIterationVector = [
        [x0],
        [y0]
    ];
    let nextIterationVector;
    let invertibleJacobianInPoint;
    let absoluteDifferenceOldXAndNewX;
    let absoluteDifferenceOldYAndNewY;

    let iteration = 0;

    do {
        ++iteration;
        invertibleJacobianInPoint = findInvertibleJacobianInPoint(currentIterationVector);
        nextIterationVector = findNextIterationVector(currentIterationVector, invertibleJacobianInPoint);
        absoluteDifferenceOldXAndNewX = Math.abs(currentIterationVector[0][0] - nextIterationVector[0][0]);
        absoluteDifferenceOldYAndNewY = Math.abs(currentIterationVector[1][0] - nextIterationVector[1][0]);
        currentIterationVector = nextIterationVector;
    } while(Math.max(absoluteDifferenceOldXAndNewX, absoluteDifferenceOldYAndNewY) > EPSILON);

    const solution = currentIterationVector;
    const error = findVectorFunctionInPoint(solution);

    return {
        "solution": solution,
        "iterations-total": iteration,
        "error": error
    };
}

function solveByModifiedNewtonMethod(x0, y0) {
    let currentIterationVector = [
        [x0],
        [y0]
    ];
    let nextIterationVector;
    let invertibleJacobianInPoint;
    let absoluteDifferenceOldXAndNewX;
    let absoluteDifferenceOldYAndNewY;
    let prevAbsoluteDifferenceOldXAndNewX;
    let prevAbsoluteDifferenceOldYAndNewY;

    let iteration = 0;
    invertibleJacobianInPoint = findInvertibleJacobianInPoint(currentIterationVector);

    do {
        ++iteration;
        nextIterationVector = findNextIterationVector(currentIterationVector, invertibleJacobianInPoint);
        absoluteDifferenceOldXAndNewX = Math.abs(currentIterationVector[0][0] - nextIterationVector[0][0]);
        absoluteDifferenceOldYAndNewY = Math.abs(currentIterationVector[1][0] - nextIterationVector[1][0]);
        if (prevAbsoluteDifferenceOldXAndNewX && prevAbsoluteDifferenceOldYAndNewY) {
            if ((prevAbsoluteDifferenceOldXAndNewX < absoluteDifferenceOldXAndNewX)
                && (prevAbsoluteDifferenceOldYAndNewY < absoluteDifferenceOldYAndNewY)) {
                return {
                    "solution": "the method is being divergent",
                    "iterations-total": null,
                    "error": null
                }
            }
        }
        prevAbsoluteDifferenceOldXAndNewX = absoluteDifferenceOldXAndNewX;
        prevAbsoluteDifferenceOldYAndNewY = absoluteDifferenceOldYAndNewY;
        currentIterationVector = nextIterationVector;
    } while(Math.max(absoluteDifferenceOldXAndNewX, absoluteDifferenceOldYAndNewY) > EPSILON);

    const solution = currentIterationVector;
    const error = findVectorFunctionInPoint(solution);

    return {
        "solution": solution,
        "iterations-total": iteration,
        "error": error
    };
}

function initCalculating() {
    const x0 = document.getElementsByClassName("input-x0")[0].value;
    const y0 = document.getElementsByClassName("input-y0")[0].value;

    const solutionByNewtonMethod = solveByNewtonMethod(x0, y0);

    document.getElementById("newton-solution").innerHTML = "("
        + solutionByNewtonMethod["solution"][0][0].toFixed(6).toString() + ", "
        + solutionByNewtonMethod["solution"][1][0].toFixed(6).toString() + ")";

    document.getElementById("newton-iterations-total").innerHTML = solutionByNewtonMethod["iterations-total"];

    document.getElementById("newton-error").innerHTML = "("
        + solutionByNewtonMethod["error"][0][0].toString() + ", "
        + solutionByNewtonMethod["error"][1][0].toString() + ")";

    ////////////////////////////////////////////////////////////////////////////

    const solutionByModifiedNewtonMethod = solveByModifiedNewtonMethod(x0, y0);

    if (isArray(solutionByModifiedNewtonMethod["solution"])) {
        document.getElementById("mod-newton-solution").innerHTML = "("
            + solutionByModifiedNewtonMethod["solution"][0][0].toFixed(6).toString() + ", "
            + solutionByModifiedNewtonMethod["solution"][1][0].toFixed(6).toString() + ")";
    } else {
        document.getElementById("mod-newton-solution").innerHTML = solutionByModifiedNewtonMethod["solution"];
    }

    if (solutionByModifiedNewtonMethod["iterations-total"]) {
        document.getElementById("mod-newton-iterations-total").innerHTML = solutionByModifiedNewtonMethod["iterations-total"].toString();
    } else {
        document.getElementById("mod-newton-iterations-total").innerHTML = "";
    }

    if (solutionByModifiedNewtonMethod["error"]) {
        document.getElementById("mod-newton-error").innerHTML = "("
            + solutionByModifiedNewtonMethod["error"][0][0].toString() + ", "
            + solutionByModifiedNewtonMethod["error"][1][0].toString() + ")";
    } else {
        document.getElementById("mod-newton-error").innerHTML = "";
    }
}

const initCalculatingButton = document.getElementsByClassName("init-calculating-button")[0];
initCalculatingButton.addEventListener('click', initCalculating);

functionPlot(plotOptions);
