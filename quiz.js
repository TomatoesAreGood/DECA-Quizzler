const params = new URLSearchParams(window.location.search);
let examName = params.get('exam');
const startNum = params.get('number');
let sector;

if(examName !== null){
    sector = examName.substring(5,8);
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
        const buttonsText = document.querySelectorAll(".quiz #choices .btn #btn-text");
        const buttons = document.querySelectorAll(".quiz #choices .btn");
        const questionNumber = document.querySelector('.quiz #number');
        const quizName = document.querySelector(".quiz #quiz-name");
        const displayQuestion = document.querySelector(".quiz #question-box #question");
        const quiz = document.querySelector(".quiz");
        var checkbox = document.querySelector('input[type="checkbox"]');

        const modal = document.getElementById("incorrectModal");
        const okButton = document.getElementById("hideModalButton");
        const modalText = document.getElementById("modalText");

        let questions = data[examName];
        let currentQuestionIndex = 0;
        let numCorrect = 0;
        let questionsAnswered = 0;
        let incorrectQuestions = [];

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
            const selectedBtn = e.target;

            if(selectedBtn.dataset.correct === "true"){
                numCorrect++;
                currentQuestionIndex++;
                setTimeout(function (){showQuestion(); }, 750)
            }else{
                selectedBtn.classList.add("incorrect");
                incorrectQuestions.push(questions[currentQuestionIndex]);
                modalText.innerHTML = `The correct answer was: ${questions[currentQuestionIndex]['answer']}<br> ${questions[currentQuestionIndex]['reasoning']}`;
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
            displayQuestion.textContent = `${currentQuestion['question']}`;
            questionNumber.textContent = currentQuestion['number'];

            for (let i = 0; i < currentQuestion['choices'].length; i++){
                buttonsText[i].textContent = currentQuestion['choices'][i].substring(2);
                if(currentQuestion['answer'] == currentQuestion['choices'][i].substring(0,1)) {
                    buttons[i].dataset.correct = "true";
                }
                buttons[i].addEventListener("click", selectAnswer);
            }
        }

        
        checkbox.addEventListener('change', function () {
            if (checkbox.checked) {
                questions = questions.slice(currentQuestionIndex,questions.length);
                shuffle(questions);
                currentQuestionIndex = 0;
                showQuestion();
            } else {
                questions = questions.slice(currentQuestionIndex,questions.length);
                sort(questions);
                currentQuestionIndex = 0;
                showQuestion();
            }
        });

        okButton.addEventListener('click', function(){
            modal.style.display = "none";
            currentQuestionIndex++;
            showQuestion(); 
        });

        if(startNum !== null && startNum <= 100){
            currentQuestionIndex = startNum - 1;
        }
        
        window.onclick = function(event){
            if(event.target == modal){
                modal.style.display = "none";
                currentQuestionIndex++;
                showQuestion(); 
            }
        }
        

        quizName.textContent = examName.replace(/HnT/g, "H&T");
        
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
