const params = new URLSearchParams(window.location.search);
const examName = params.get('exam');
let sector;

if(examName !== null){
    sector = examName.substring(5,8);
}else{
    sector = "";
}

const shuffleButton = document.querySelector('.checkbox');



document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.querySelector('input[type="checkbox"]');
  
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        console.log('Checked');
      } else {
        console.log('Not checked');
      }
    });
  });

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

        const modal = document.getElementById("incorrectModal");
        const modalText = document.getElementById("modalText");

        quizName.textContent = examName
        const questions = data[examName];
        let currentQuestionIndex = 0;
        let numCorrect = 0;

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
                setTimeout(function (){resetButtons(); showQuestion(); }, 1000)
            }else{
                selectedBtn.classList.add("incorrect");
                modalText.innerHTML = `The correct answer was: ${questions[currentQuestionIndex]['answer']}<br> ${questions[currentQuestionIndex]['reasoning']}`;
                modal.style.display = "block";
            }
            revealAnswer();
        }

        function showQuestion(){
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
        window.onclick = function(event){
            if(event.target == modal){
                modal.style.display = "none";
                currentQuestionIndex++;
                resetButtons(); 
                showQuestion(); 
            }
        }

        showQuestion();
        
    
    }else{
        throw 'exam does not exist';
    }
}).catch(error => {
    console.log(error);
})
