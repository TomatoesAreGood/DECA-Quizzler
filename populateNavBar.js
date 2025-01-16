async function fetchExam(sector, dropdown){
    if(sessionStorage.getItem(sector) != null){
        let storedExams = sessionStorage.getItem(sector).split(',');
        for (const item of storedExams){
            if(item.length > 15){
                dropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item.substring(0,13)}...</a>
                </li>
            `; 
            }else{
                dropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `; 
            }
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch(`data/${sector}.json`)
        .then(response => response.json())
        .then(data => {
            let exams = Object.keys(data);
            exams.push(`9999-${sector}-UNIT`);

            for(const item of exams){
                if(item.length > 15){
                    dropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?&exam=${item}">${item.substring(0,13)}...</a>
                    </li>
                `; 
                }else{
                    dropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?&exam=${item}">${item}</a>
                    </li>
                `; 
                }
            }
            allExams = allExams.concat(Array.from(exams));
            sessionStorage.setItem(sector, exams);
        });
    }
}

function trimNavBar(){
    for(let i = 0; i < allDropdowns.length; i++){
        allDropdowns[i].style.display = "flex";
        allDropdowns[i].style.maxWidth = "700px";
        allDropdowns[i].style.flexWrap = "wrap";
        
        var width = allDropdowns[i].offsetWidth;
        var remainder = width % 175;

        if(width-remainder !== 0){
            allDropdowns[i].style.width = `${width-remainder}px`;
        }
        allDropdowns[i].style.display = "";
    }
}

function hideOnClickOutside(element) {
    const outsideClickListener = event => {
        if (!element.contains(event.target) && isVisible(element)) { 
          element.style.display = 'none';
          removeClickListener();
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener);
    }

    document.addEventListener('click', outsideClickListener);
}

function hideOnClickOutsideSearchBar(element1, element2) {
    const outsideClickListener = event => {
        if (!element2.contains(event.target) && isVisible(element1)) { 
            element1.style.display = 'none';
            removeClickListener();
        }
    }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener);
    }

    document.addEventListener('click', outsideClickListener);
}

function selectInput(path){
    resultBox.innerHTML = '';
    window.location.assign(`quiz.html?&exam=${path}`);
}

const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length); 

const toggle = document.querySelector(".toggle");
const closeSideBar = document.querySelector(".closeSidebar");
const sidebar = document.querySelector(".sidebar");
const resultBox = document.querySelector(".result-box");
const inputBox = document.getElementById("input")

const allDropdowns = document.querySelectorAll(".dropdown .grid-container");
const entDropdown = allDropdowns[0];
const finDropdown = allDropdowns[1];
const mktDropdown = allDropdowns[2];
const hosptDropdown = allDropdowns[3];
const bmaDropdown = allDropdowns[4];
const coreDropdown = allDropdowns[5];

let allExams = [];
const fetchExams = [fetchExam("ENT", entDropdown),fetchExam("FIN", finDropdown),fetchExam("MKT", mktDropdown),fetchExam("HnT", hosptDropdown),fetchExam("BMA", bmaDropdown),fetchExam("CORE", coreDropdown)];


function searchResult(){
    let results = [];
    let input = inputBox.value;

    if(input.length){
        results = allExams.filter((keyword)=>{
            return keyword.toLowerCase().includes(input.toLowerCase())
        });
        const content = results.map((list)=>{
            if(list.length > 18){
                return `<li onclick=selectInput("${list}")>${list.substring(0,19)}...</li>`;
            }
            return `<li onclick=selectInput("${list}")>${list}</li>`;
        });
        resultBox.innerHTML = `<ul>${content.join('')}</ul>`;
        resultBox.style.display = 'block';

        if(results.length === 0){
            resultBox.innerHTML = '';
        }
    }else{
        resultBox.innerHTML = "";
    }
}

Promise.all(fetchExams)
.then( function(){
    inputBox.onkeyup = searchResult;
    inputBox.onclick = function(){
        hideOnClickOutsideSearchBar(resultBox, inputBox);
        searchResult();
    };
    setTimeout(() => {
        trimNavBar();
    }, 100);
});


toggle.addEventListener("click", function(){
    hideOnClickOutside(sidebar);
    setTimeout(() => {
        sidebar.style.display = "flex";
    }, 1);
});

closeSideBar.addEventListener("click", function(){
    sidebar.style.display = "none";
});




