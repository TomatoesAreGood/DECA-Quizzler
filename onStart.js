const dropdown = document.querySelector(".dropdown");

if(sessionStorage.getItem("ENT") != null){
    let storedExams = sessionStorage.getItem("ENT").split(',')
    for (const item of storedExams){
        dropdown.innerHTML += `
            <li>
                <a href = "quiz.html?sector=ENT&name=${item}">${item}</a>
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
            dropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?sector=ENT&name=${key}">${key}</a>
                </li>
            `
            entExams.push(key)
        }
        sessionStorage.setItem("ENT", entExams)
    })
}






