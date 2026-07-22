import personalRecommendationIndex from "/personalRecommendationIndex.js";

const fitInput = document.getElementById("fit-modifier");
const trustInput = document.getElementById("trust-multiplier");
const scoreInput = document.getElementById("community-score");
const fit = document.getElementById("current-fit");
const trust = document.getElementById("current-trust");
const score = document.getElementById("current-score");
const pri = document.getElementById("pri");

fit.innerText = fitInput.value;
trust.innerText= trustInput.value;
score.innerText = scoreInput.value;

function updatePRI() {
    pri.innerText = `PRI: ${personalRecommendationIndex(
        Number(scoreInput.value),
        Number(fitInput.value),
        Number(trustInput.value), 
    ).toFixed(1)}`;
}

fitInput.addEventListener("input", (event) => {
    fit.innerText = event.target.value;
    updatePRI(); 
});

trustInput.addEventListener("input", (event) => {
    trust.innerText = event.target.value;
    updatePRI(); 
});

scoreInput.addEventListener("input", (event) => {
    score.innerText = event.target.value;
    updatePRI(); 
});

updatePRI();
