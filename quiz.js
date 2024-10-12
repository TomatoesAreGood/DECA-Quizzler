const params = new URLSearchParams(window.location.search)
const examName = params.get('name')
const sector = params.get('name').substring(5,8)

const quizName = document.querySelector(".quiz #quizName");
quizName.textContent = examName

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
