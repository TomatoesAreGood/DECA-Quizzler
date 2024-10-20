const allDropdowns = document.querySelectorAll(".dropdown .grid-container");
const entDropdown = allDropdowns[0];
const finDropdown = allDropdowns[1];
const mktDropdown = allDropdowns[2];
const hosptDropdown = allDropdowns[3];
const bmaDropdown = allDropdowns[4];
const coreDropdown = allDropdowns[5];

async function fetchEnt(){
    if(sessionStorage.getItem("ENT") != null){
        let storedExams = sessionStorage.getItem("ENT").split(',');
        for (const item of storedExams){
            entDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `;    
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("ENT.json")
        .then(response => response.json())
        .then(data => {
            for(const key of Object.keys(data)){   
                entDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?exam=${key}">${key}</a>
                    </li>
                `;
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("ENT", Object.keys(data));
        });
    }
}
async function fetchFin(){
    if(sessionStorage.getItem("FIN") != null){
        let storedExams = sessionStorage.getItem("FIN").split(',');
        for (const item of storedExams){
            finDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `;     
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("FIN.json")
        .then(response => response.json())
        .then(data => {
            for(const key of Object.keys(data)){
                finDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?exam=${key}">${key}</a>
                    </li>
                `;
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("FIN", Object.keys(data));
        });
    }
}

async function fetchMkt(){
    if(sessionStorage.getItem("MKT") != null){
        let storedExams = sessionStorage.getItem("MKT").split(',');
        for (const item of storedExams){
            mktDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `;     
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("MKT.json")
        .then(response => response.json())
        .then(data => {
            for(const key of Object.keys(data)){
                mktDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?exam=${key}">${key}</a>
                    </li>
                `;
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("MKT", Object.keys(data));
        });
    }
}

async function fetchHnt(){
    if(sessionStorage.getItem("H&T") != null){
        let storedExams = sessionStorage.getItem("H&T").split(',');
        for (const item of storedExams){
            hosptDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item.substring(0,4)}-H&T</a>
                </li>
            `;
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("HnT.json")
        .then(response => response.json())
        .then(data => {
            for(const key of Object.keys(data)){
                hosptDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?exam=${key}">${key.substring(0,4)}-H&T</a>
                    </li>
                `;
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("H&T", Object.keys(data));
        });
    }
}

async function fetchBma(){
    if(sessionStorage.getItem("BMA") != null){
        let storedExams = sessionStorage.getItem("BMA").split(',');
        for (const item of storedExams){
            bmaDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `;
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("BMA.json")
        .then(response => response.json())
        .then(data => {
            for(const key of Object.keys(data)){
                bmaDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?exam=${key}">${key}</a>
                    </li>
                `;
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("BMA", Object.keys(data));
        });
    }
}

async function fetchCore(){
    if(sessionStorage.getItem("CORE") != null){
        let storedExams = sessionStorage.getItem("CORE").split(',');
        for (const item of storedExams){
            if(item.length > 15){
                coreDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item.substring(0,13)}...</a>
                </li>
            `; 
            }else{
                coreDropdown.innerHTML += `
                <li class="dropdown-element">
                    <a href = "quiz.html?&exam=${item}">${item}</a>
                </li>
            `; 
            }
        }
        allExams = allExams.concat(storedExams);
    }else{
        fetch("CORE.json")
        .then(response => response.json())
        .then(data => {
            for(const item of Object.keys(data)){
                if(item.length > 15){
                    coreDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?&exam=${item}">${item.substring(0,13)}...</a>
                    </li>
                `; 
                }else{
                    coreDropdown.innerHTML += `
                    <li class="dropdown-element">
                        <a href = "quiz.html?&exam=${item}">${item}</a>
                    </li>
                `; 
                }
            }
            allExams = allExams.concat(Array.from(Object.keys(data)));
            sessionStorage.setItem("CORE", Object.keys(data));
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

const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length ); 

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


const toggle = document.querySelector(".toggle");
const closeSideBar = document.querySelector(".closeSidebar");
const sidebar = document.querySelector(".sidebar");
const resultBox = document.querySelector(".result-box");
const inputBox = document.getElementById("input")

let allExams = [];
const fetchExams = [fetchEnt(),fetchFin(),fetchMkt(),fetchHnt(),fetchBma(),fetchCore()];

function selectInput(list){
    resultBox.innerHTML = '';
    window.location.assign(`quiz.html?&exam=${list.innerHTML}`);
}


Promise.all(fetchExams)
.then( function(){
    inputBox.onkeyup = function(){
        let results = [];
        let input = inputBox.value;

        if(input.length){
            results = allExams.filter((keyword)=>{
                return keyword.toLowerCase().includes(input.toLowerCase())
            });
            const content = results.map((list)=>{
                if(list.length > 18){
                    list = `${list.substring(0,19)}...`;
                }
                return `<li onclick=selectInput(this)>${list}</li>`;
            });
            resultBox.innerHTML = `<ul>${content.join('')}</ul>`;

            if(results.length === 0){
                resultBox.innerHTML = '';
            }
        }else{
            resultBox.innerHTML = "";
        }
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




