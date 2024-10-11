const params = new URLSearchParams(window.location.search)
const sector = params.get('sector')
const examName = params.get('name')

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
        const questionName = document.querySelector(".quiz #question");
        let currentQuestionIndex = 0;
        let numCorrect = 0;



        function showQuestion(){
            let currentQuestion = questions[currentQuestionIndex];
            questionName.textContent = `${currentQuestion['number']}. ${currentQuestion['question']}`;
            const buttons = document.querySelectorAll(".quiz #choices .btn");
            for (let i = 0; i < currentQuestion['choices'].length ;i++){
                buttons[i].textContent = currentQuestion['choices'][i];
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
