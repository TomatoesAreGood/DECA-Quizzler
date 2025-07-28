const nameSpace = "decaquizzler333";
const date = new Date();
const activityKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
const uniqueVisitsKey = `u${activityKey}`;
const visitKey = `v${activityKey}`;

function deleteExtraLocalStorage(){
    keys = Object.keys(localStorage);
    i = keys.length;

    while (i--){
        if(keys[i] !== "uniqueVisit" && keys[i] !== activityKey && keys[i] !== "favExams"){
            localStorage.removeItem(keys[i]);
        }
    }
}

if(Object.keys(localStorage).length > 10){
    deleteExtraLocalStorage();
}

fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${activityKey}`);

if(localStorage.getItem("uniqueVisit") === null){
    fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${uniqueVisitsKey}`)
        .then( response => {
            localStorage.setItem("uniqueVisit", "True");
        }
    )
}
if(localStorage.getItem(activityKey) === null){
    fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${visitKey}`)
        .then( response => {
            localStorage.setItem(activityKey, "True");
        }
    )
}

