const nameSpace = "decaquizzler333";
const date = new Date();
const visitsKey = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
const uniqueVisitsKey = `u${date.getFullYear()}${date.getMonth()}${date.getDate()}`;

fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${visitsKey}`);

if(localStorage.getItem("uniqueVisit") === null){
    fetch(`https://abacus.jasoncameron.dev/hit/${nameSpace}/${uniqueVisitsKey}`)
        .then( response => {
            localStorage.setItem("uniqueVisit", "True");
        }
    )
}

