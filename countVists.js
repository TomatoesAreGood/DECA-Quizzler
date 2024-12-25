
const visitsKey = "decaquizzler1234";
const visitsAdminKey = "cd0accd9-8c3d-4de6-88bd-92d749a909f2";
const uniqueVisitsKey = "decaquizzlerunique1234";
const uniqueVisitsAdminKey = "fa20af18-1004-45ce-a031-114d21bfc3de";

fetch(`https://abacus.jasoncameron.dev/hit/${visitsKey}/`)
    .then( response => {
        if(!response.ok){
            throw new Error("API error");
        }
    }
).catch(error => {
    console.error(error);
});
 

if(localStorage.getItem("uniqueVisit") === null){
    fetch(`https://abacus.jasoncameron.dev/hit/${uniqueVisitsKey}/`)
        .then( response => {
            if(!response.ok){
                throw new Error("API error");
            }
            localStorage.setItem("uniqueVisit", "True");
        }
    ).catch(error => {
        console.error(error);
    });
}
fetch(`https://abacus.jasoncameron.dev/set/${visitsKey}?value=15`, {
    method: "POST",
    body: JSON.stringify({
    //   "value": 10,
        "Authorization": `Bearer ${visitsAdminKey}`
    }), 
    // headers: {
    //   "Authorization": `Bearer ${visitsAdminKey}`
    // }
  }).then( response => {
    console.log(response.status);
});   


// fetch("visits.json")
//     .then(response => response.json())
//         .then(data => {
//             const date = new Date();
//             const currentWeekday = date.getDay();

//             const weeklyVisits = data["weeklyVisits"];
//             const weekday = data["weekday"];

//             if(currentWeekday !== weekday){

//             }

//             if(localStorage.getItem("lastUpdate") === null){
    
//                 localStorage.setItem("lastUpdate", date.getDate());
            
//                 // localStorage.setItem("lastUpdate", data.toString());
//             }else{
//                 const lastUpdate = localStorage.getItem("lastUpdate");
//             }

//         }
//     );

