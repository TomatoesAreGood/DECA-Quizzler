const params = new URLSearchParams(window.location.search);
const examName = params.get('exam');
let sector;

if(examName !== null){
    sector = examName.substring(5,8);
}else{
    sector = "";
}

const shuffleButton = document.querySelector('.checkbox');

const buttonsText = document.querySelectorAll(".quiz #choices .btn #btn-text");
const buttons = document.querySelectorAll(".quiz #choices .btn");

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
        const quizName = document.querySelector(".quiz #quizName");
        quizName.textContent = examName
        const questions = data[examName];
        const displayQuestion = document.querySelector(".quiz #question-box #question");
        let currentQuestionIndex = 0;
        let numCorrect = 0;

        function selectAnswer(e){
            // console.log(e.target === child);
        
            const selectedBtn = e.target;
            console.log(selectedBtn.dataset.correct === "true");
            if(selectedBtn.dataset.correct === "true"){
                selectedBtn.classList.add("correct");
                numCorrect++;
            }else{
                selectedBtn.classList.add("incorrect");
            }
            for (let i = 0; i < buttons.length; i++){
                if(buttons[i].dataset.correct === "true"){
                    buttons[i].classList.add("correct");
                }
                buttons[i].disabled = true;
            }

        }

        function showQuestion(){
            let currentQuestion = questions[currentQuestionIndex];
            displayQuestion.textContent = `${currentQuestion['question']}`;

            for (let i = 0; i < currentQuestion['choices'].length; i++){
                buttonsText[i].textContent = currentQuestion['choices'][i].substring(2);
                if(currentQuestion['answer'] == currentQuestion['choices'][i].substring(0,1)) {
                    buttons[i].dataset.correct = "true";
                }
                buttons[i].addEventListener("click", selectAnswer);
            }
        }
        showQuestion();
        
    
        console.log(questions);
    }else{
        throw 'exam does not exist';
    }
}).catch(error => {
    console.log(error);
})
