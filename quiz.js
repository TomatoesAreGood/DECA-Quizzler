const params = new URLSearchParams(window.location.search);
let examName = params.get('exam');
const startNum = params.get('number');
let sector;

if(examName !== null){
    sector = examName.substring(5,8);
    if(sector === "COR"){
        sector = "CORE";
    }
}else{
    sector = "";
}


function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }

function sort(arr){
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;

        while (j >= 0 && arr[j]['number'] > key['number']) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}

function linkify(text) {
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" class="underline" target="_blank"> ${url} </a>`;
    });
}

const buttonsText = document.querySelectorAll(".quiz #choices .btn #btn-text");
const buttons = document.querySelectorAll(".quiz #choices .btn");
const questionNumber = document.querySelector('.quiz #number');
const quizName = document.querySelector(".quiz #quiz-name");
const displayQuestion = document.querySelector(".quiz #question-box #question");
const quiz = document.querySelector(".quiz");
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const shuffleToggle = checkboxes[1];
const slowModeToggle = checkboxes[0];

const nextQuestionButton = document.getElementById("next-question");
const showExplanationButton = document.getElementById("show-explanation");

const exitButton = document.getElementById("summary-btn");
const confirmExitButton = document.getElementById('confirmExitModalButton');

const confirmExitModal = document.getElementById("confirmExitModal");
const modal = document.getElementById("incorrectModal");
const okButton = document.getElementById("hideModalButton");
const modalText = document.getElementById("modalText");
let isUnitTest = false;

if(examName.substring(examName.length-4, examName.length) === "UNIT"){
    sector = examName.substring(5, examName.length);
    isUnitTest = true;
}

fetch(`${sector}.json`)
.then(response => {
    if(response.ok){
        return response.json();
    }else{
        throw 'file does not exist';
    }
})
.then(data => {
    if (examName in data){
        let questions = data[examName];
        let currentQuestionIndex = 0;
        let numCorrect = 0;
        let questionsAnswered = 0;
        let incorrectQuestions = [];
        let isSlowMode = false;

        function showSummary(){
            incorrectQuestions.sort(function(a, b) {
                return a['number'] - b['number'];
            });
            quiz.style.margin = "10px";
            quiz.innerHTML = `
                <h1>${examName.replace(/HnT/g, "H&T")} Summary</h1>
                <p>You got ${numCorrect}/${questionsAnswered} correct. These are the questions you got wrong: </p>
            `;
            if(isUnitTest){
                for (let i = 0; i < incorrectQuestions.length; i++){
                    quiz.innerHTML += `
                        <h3 class="question-summary">${incorrectQuestions[i]['number']}. ${incorrectQuestions[i]['question']} (${incorrectQuestions[i]['exam']})</h3>
                    `;
                    for (let j = 0; j < incorrectQuestions[i]['choices'].length; j++){
                        if(incorrectQuestions[i]['choices'][j].substring(0,1) === incorrectQuestions[i]['answer']){
                            quiz.innerHTML += ` 
                                <p class="underline">
                                    ${incorrectQuestions[i]['choices'][j]}
                                </p>
                            `;
                        }else{
                            quiz.innerHTML += ` 
                                <p>
                                    ${incorrectQuestions[i]['choices'][j]}
                                </p>
                            `;
                        }
                    }
                }
            }else{
                for (let i = 0; i < incorrectQuestions.length; i++){
                    quiz.innerHTML += `
                        <h3 class="question-summary">${incorrectQuestions[i]['number']}. ${incorrectQuestions[i]['question']} </h3>
                    `;
                    for (let j = 0; j < incorrectQuestions[i]['choices'].length; j++){
                        if(incorrectQuestions[i]['choices'][j].substring(0,1) === incorrectQuestions[i]['answer']){
                            quiz.innerHTML += ` 
                                <p class="underline">
                                    ${incorrectQuestions[i]['choices'][j]}
                                </p>
                            `;
                        }else{
                            quiz.innerHTML += ` 
                                <p>
                                    ${incorrectQuestions[i]['choices'][j]}
                                </p>
                            `;
                        }
                    }
                }
            }
        }

        function revealAnswer(){
            for (let i = 0; i < buttons.length; i++){
                if(buttons[i].dataset.correct === "true"){
                    buttons[i].classList.add("correct");
                }
                buttons[i].disabled = true;
            }
        }

        function resetButtons(){
            for (let i = 0; i < buttons.length; i++){
                buttons[i].disabled = false;
                buttons[i].dataset.correct = "false";
                buttons[i].classList.remove("correct");
                buttons[i].classList.remove("incorrect");
            }
        }

        function selectAnswer(e){
            if(isSlowMode){
                nextQuestionButton.style.display = "block";
                showExplanationButton.style.display = "block";
                var reasoning = questions[currentQuestionIndex]['reasoning'];
                modalText.innerHTML = `The correct answer was: ${questions[currentQuestionIndex]['answer']}<br> <b>${reasoning.substring(0, reasoning.indexOf('.'))}</b>${linkify(reasoning.substring(reasoning.indexOf('.')))}`;
            }

            const selectedBtn = e.target;

            if(selectedBtn.dataset.correct === "true"){
                numCorrect++;
                if(!isSlowMode){
                    currentQuestionIndex++;
                    setTimeout(function (){showQuestion(); }, 750);
                }
            }else{
                selectedBtn.classList.add("incorrect");
                incorrectQuestions.push(questions[currentQuestionIndex]);
                var reasoning = questions[currentQuestionIndex]['reasoning'];

                modalText.innerHTML = `The correct answer was: ${questions[currentQuestionIndex]['answer']}<br> <b>${reasoning.substring(0, reasoning.indexOf('.'))}</b>${linkify(reasoning.substring(reasoning.indexOf('.')))}`;
                modal.style.display = "block";
            }
            questionsAnswered++;
            revealAnswer();
        }

        function showQuestion(){
            if(currentQuestionIndex >= questions.length){
                showSummary();
                return;
            }
            resetButtons();

            let currentQuestion = questions[currentQuestionIndex];
            if(isUnitTest){
                displayQuestion.textContent = `(${currentQuestion['exam']}) ${currentQuestion['question']}`;
            }else{
                displayQuestion.textContent = `${currentQuestion['question']}`;
            }
            questionNumber.textContent = currentQuestion['number'];

            for (let i = 0; i < currentQuestion['choices'].length; i++){
                buttonsText[i].textContent = currentQuestion['choices'][i].substring(2);
                if(currentQuestion['answer'] == currentQuestion['choices'][i].substring(0,1)) {
                    buttons[i].dataset.correct = "true";
                }
                buttons[i].addEventListener("click", selectAnswer);
            }
            nextQuestionButton.style.display = 'none';
            showExplanationButton.style.display = 'none';
        }

        slowModeToggle.addEventListener('change', function(){
            if(slowModeToggle.checked){
                isSlowMode = true;
                okButton.style.display = 'block';
            }else{
                isSlowMode = false;
                okButton.style.display = 'none';
            }
        });

        shuffleToggle.addEventListener('change', function () {
            if (shuffleToggle.checked) {
                questions = questions.slice(currentQuestionIndex,questions.length);
                shuffle(questions);
                currentQuestionIndex = 0;
            }else{
                questions = questions.slice(currentQuestionIndex,questions.length);
                sort(questions);
                currentQuestionIndex = 0;
            }
            showQuestion();
        });

        nextQuestionButton.addEventListener('click',function(){
            currentQuestionIndex++;
            showQuestion();
        });

        showExplanationButton.addEventListener('click', function(){
            modal.style.display = 'block';
        });

        exitButton.addEventListener('click', function(){
            confirmExitModal.style.display = 'block';
        });

        confirmExitButton.addEventListener('click', function(){
            confirmExitModal.style.display = 'none';
            showSummary();
        });

        okButton.addEventListener('click', function(){
            modal.style.display = "none";
        });

    
        window.onclick = function(event){
            if(event.target === modal){
                modal.style.display = "none";
                if(!isSlowMode){
                    currentQuestionIndex++;
                    showQuestion();
                }
            }
            if(event.target === confirmExitModal){
                confirmExitModal.style.display = "none";
            }
        }

        if(startNum !== null && startNum <= 100){
            currentQuestionIndex = startNum - 1;
        }

        quizName.textContent = examName.replace(/HnT/g, "H&T");
        sort(questions);
        showQuestion();
    }else{
        throw 'exam does not exist';
    }
}).catch(error => {     
    const quiz = document.querySelector(".quiz");
    quiz.innerHTML = `
        <h1>Error 404: Exam ${examName} not found</h1>
    `;
})

