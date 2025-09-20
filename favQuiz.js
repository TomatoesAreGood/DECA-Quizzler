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

function toggleFavBtn(){
    if(favButtonIcon.style.color === "yellow"){
        favButtonIcon.style.color = "transparent";
    }else{
        favButtonIcon.style.color = "yellow";
    }
}

async function getQuestions(sector, questionData){
    if(questionData.length == 0){
        return [];
    }

    const response = await fetch(`data/${sector}.json`);
    const data = await response.json();
    let favQuestions = [];

    for (let i = 0; i < Object.entries(questionData).length; i++){
        if(Object.entries(questionData)[i][1].length > 0){
            let examName = questionData[i][0];
            let questionNumbers = questionData[i][1];
            for (var j = 0; j < questionNumbers.length; j++){
                question = data[examName][questionNumbers[j]-1];
                question['exam'] = examName;
                favQuestions = favQuestions.concat(question);
            }
        }
    }
    return favQuestions;
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
const modalHeader = document.getElementById('modalHeader');

const favButton = document.getElementById('fav-btn');
const favButtonIcon = favButton.querySelector('i');

let favExams = JSON.parse(localStorage.getItem('favExams'));

if(favExams === null || Object.entries(favExams).length === 0){
    const quiz = document.querySelector(".quiz");
    quiz.innerHTML = `
        <h1>Favorited questions will show up here</h1>
    `;
}else{
    let foundSectors = {"ENT": [], "FIN": [], "MKT": [], "HnT": [], "CORE": [], "BMA": []};
    for(let i = 0; i < Object.keys(favExams).length; i++){
        let sector = Object.keys(favExams)[i].substring(5,8);
        if(sector === "COR"){
            foundSectors["CORE"].push(Object.entries(favExams)[i]);
        }
        if(sector in foundSectors){
            foundSectors[sector].push(Object.entries(favExams)[i]);
        }   
    }

    const promiseQuesitons = [
        getQuestions("ENT",foundSectors['ENT']),
        getQuestions("FIN",foundSectors['FIN']),
        getQuestions("MKT",foundSectors['MKT']),
        getQuestions("HnT",foundSectors['HnT']),
        getQuestions("BMA",foundSectors['BMA']),
        getQuestions("CORE",foundSectors['CORE'])
    ];
    
    Promise.all(promiseQuesitons).then(function(results){
        let questions = results.flat();
        let currentQuestionIndex = 0;
        let numCorrect = 0;
        let questionsAnswered = 0;
        let incorrectQuestions = [];
        let isSlowMode = false;
        let examName = "FAV-EXAM";

        function showSummary(){
            incorrectQuestions.sort(function(a, b) {
                return a['number'] - b['number'];
            });
            quiz.style.margin = "10px";
            quiz.innerHTML = `
                <h1>${examName.replace(/HnT/g, "H&T")} Summary</h1>
                <p>You got ${numCorrect}/${questionsAnswered} correct. These are the questions you got wrong: </p>
            `;
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

        function updateFavButton(){
            favButtonIcon.style.color = 'transparent';

            if(localStorage.getItem('favExams') === null){
                return;
            }
            let favExams = JSON.parse(localStorage.getItem('favExams'));

            if(questions[currentQuestionIndex]['exam'] in favExams){
                if(favExams[questions[currentQuestionIndex]['exam']].includes(questions[currentQuestionIndex]['number'])){
                    favButtonIcon.style.color = 'yellow';
                }
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
            updateFavButton();

            let currentQuestion = questions[currentQuestionIndex];
            displayQuestion.textContent = `(${currentQuestion['exam']}) ${currentQuestion['question']}`;
            
            questionNumber.textContent = currentQuestion['number'];

            for (let i = 0; i < currentQuestion['choices'].length; i++){
                buttonsText[i].textContent = currentQuestion['choices'][i].substring(2);
                if(currentQuestion['answer'] === currentQuestion['choices'][i].substring(0,1)) {
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
            modalHeader.innerText = 'EXPLANATION';
            modalHeader.style.color = "#079e28";
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
            modalHeader.innerText = 'WRONG';
            modalHeader.style.color = '#FF2F6A';
        });

        favButton.addEventListener('click', function(){
            toggleFavBtn();
            let favExams = JSON.parse(localStorage.getItem('favExams'));
            const questionExamName = questions[currentQuestionIndex]['exam'];

            if(favButtonIcon.style.color === "yellow"){
                if(favExams === null){
                    localStorage.setItem('favExams', JSON.stringify({[questionExamName]:[questions[currentQuestionIndex]['number']]}));
                }else{
                    if(questionExamName in favExams){
                        favExams[questionExamName].push(questions[currentQuestionIndex]['number']);
                    }else{
                        favExams[questionExamName] = [questions[currentQuestionIndex]['number']];
                    }
                    localStorage.setItem('favExams', JSON.stringify(favExams));
                }
            }else{
                const index = favExams[questionExamName].indexOf(questions[currentQuestionIndex]['number']);
                favExams[questionExamName].splice(index,1);
                if(favExams[questionExamName].length === 0){
                    delete favExams[questionExamName];
                }
                localStorage.setItem('favExams', JSON.stringify(favExams));
            }
        });

    
        window.onclick = function(event){
            if(event.target === modal){
                modal.style.display = "none";
                if(!isSlowMode){
                    currentQuestionIndex++;
                    showQuestion();
                }
                modalHeader.innerText = 'WRONG';
                modalHeader.style.color = '#FF2F6A';
            }
            if(event.target === confirmExitModal){
                confirmExitModal.style.display = "none";
            }
        }

        quizName.textContent = examName.replace(/HnT/g, "H&T");
        sort(questions);
        showQuestion();
    });
}

