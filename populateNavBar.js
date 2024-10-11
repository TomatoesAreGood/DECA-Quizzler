const entDropdown = document.querySelector(".dropdown .grid-container");

if(sessionStorage.getItem("ENT") != null){
    let storedExams = sessionStorage.getItem("ENT").split(',')
    for (const item of storedExams){
        entDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&name=${item}">${item}</a>
            </li>
        `
    }
}else{
    fetch("ENT.json")
    .then(response => response.json())
    .then(data => {
        console.log(data)
        let entExams = []
        for(const key of Object.keys(data)){
            console.log(key)
            entDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?name=${key}">${key}</a>
                </li>
            `
            entExams.push(key)
        }
        sessionStorage.setItem("ENT", entExams)
    })
}






