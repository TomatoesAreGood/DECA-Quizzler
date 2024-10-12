const params = new URLSearchParams(window.location.search);
const examName = params.get('exam');
const sector = params.get('exam').substring(5,8);
const quizName = document.querySelector(".quiz #quizName");

const shuffleButton = document.querySelector('.checkbox');

document.addEventListener('DOMContentLoaded', function () {
    var checkbox = document.querySelector('input[type="checkbox"]');
  
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        // do this
        console.log('Checked');
      } else {
        // do that
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
        quizName.textContent = examName
        const questions = data[examName];
        const displayQuestion = document.querySelector(".quiz #question-box #question");
        let currentQuestionIndex = 0;
        let numCorrect = 0;

        function showQuestion(){
            let currentQuestion = questions[currentQuestionIndex];
            displayQuestion.textContent = `${currentQuestion['question']}`;
            const buttons = document.querySelectorAll(".quiz #choices .btn #btn-text");
            for (let i = 0; i < currentQuestion['choices'].length ;i++){
                buttons[i].textContent = currentQuestion['choices'][i].substring(2);
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
