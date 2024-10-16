const allDropdowns = document.querySelectorAll(".dropdown .grid-container");
const entDropdown = allDropdowns[0];
const finDropdown = allDropdowns[1];
const mktDropdown = allDropdowns[2];
const hosptDropdown = allDropdowns[3];

if(sessionStorage.getItem("ENT") != null){
    let storedExams = sessionStorage.getItem("ENT").split(',');
    for (const item of storedExams){
        entDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
            </li>
        `;     
    }
}else{
    fetch("ENT.json")
    .then(response => response.json())
    .then(data => {
        for(const key of Object.keys(data)){
            entDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `;
        }
        sessionStorage.setItem("ENT", Object.keys(data));
    });
}

if(sessionStorage.getItem("FIN") != null){
    let storedExams = sessionStorage.getItem("FIN").split(',');
    for (const item of storedExams){
        finDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
            </li>
        `;     
    }
}else{
    fetch("FIN.json")
    .then(response => response.json())
    .then(data => {
        for(const key of Object.keys(data)){
            finDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `;
        }
        sessionStorage.setItem("FIN", Object.keys(data));
    });
}

if(sessionStorage.getItem("MKT") != null){
    let storedExams = sessionStorage.getItem("MKT").split(',');
    for (const item of storedExams){
        mktDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item}</a>
            </li>
        `;     
    }
}else{
    fetch("MKT.json")
    .then(response => response.json())
    .then(data => {
        for(const key of Object.keys(data)){
            mktDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key}</a>
                </li>
            `;
        }
        sessionStorage.setItem("MKT", Object.keys(data));
    });
}


if(sessionStorage.getItem("H&T") != null){
    let storedExams = sessionStorage.getItem("H&T").split(',');
    for (const item of storedExams){
        hosptDropdown.innerHTML += `
            <li>
                <a href = "quiz.html?&exam=${item}">${item.substring(0,4)}-H&T</a>
            </li>
        `;
    }
}else{
    fetch("HnT.json")
    .then(response => response.json())
    .then(data => {
        for(const key of Object.keys(data)){
            hosptDropdown.innerHTML += `
                <li>
                    <a href = "quiz.html?exam=${key}">${key.substring(0,4)}-H&T</a>
                </li>
            `;
        }
        sessionStorage.setItem("H&T", Object.keys(data));
    });
}

