const entDropdown = document.querySelectorAll(".dropdown .grid-container")[0];
const finDropdown = document.querySelectorAll(".dropdown .grid-container")[1];
const mktDropdown = document.querySelectorAll(".dropdown .grid-container")[2];


if(sessionStorage.getItem("ENT") != null){
    let storedExams = sessionStorage.getItem("ENT").split(',')
    for (const item of storedExams){
        entDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
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
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `
            entExams.push(key)
        }
        sessionStorage.setItem("ENT", entExams)
    })
}

if(sessionStorage.getItem("FIN") != null){
    let storedExams = sessionStorage.getItem("FIN").split(',')
    for (const item of storedExams){
        finDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
            </li>
        `     
    }
}else{
    fetch("FIN.json")
    .then(response => response.json())
    .then(data => {
        let finExams = []
        for(const key of Object.keys(data)){
            finDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `
            finExams.push(key)
        }
        sessionStorage.setItem("FIN", finExams)
    })
}

if(sessionStorage.getItem("MKT") != null){
    let storedExams = sessionStorage.getItem("MKT").split(',')
    for (const item of storedExams){
        entDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
            </li>
        `     
    }
}else{
    fetch("MKT.json")
    .then(response => response.json())
    .then(data => {
        console.log(data)
        let mktExams = []
        for(const key of Object.keys(data)){
            console.log(key)
            mktDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `
            mktExams.push(key)
        }
        sessionStorage.setItem("MKT", mktExams)
    })
}



