fetch("ENT.json")
.then(response => response.json())
.then(data => {
    console.log(data)
    const ul = document.querySelector(".dropdown");
    for(const key of Object.keys(data)){
        console.log(key)
        ul.innerHTML += `
            <li>
                <a href = "quiz.html?sector=ENT&name=${key}">${key}</a>
            </li>
        `
    }
})







