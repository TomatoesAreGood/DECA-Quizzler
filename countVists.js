
const vistsKey = "decaquizzler123";
const uniqueVistsKey = "decaquizzlerunique123";

fetch(`https://abacus.jasoncameron.dev/hit/${vistsKey}/`)
    .then( response => {
        if(!response.ok){
            throw new Error("API error");
        }
    }
).catch(error => {
    console.error(error);
});
 

if(localStorage.getItem("uniqueVist") == null){
    fetch(`https://abacus.jasoncameron.dev/hit/${uniqueVistsKey}/`)
        .then( response => {
            if(!response.ok){
                throw new Error("API error");
            }
            localStorage.setItem("uniqueVist", "True");
        }
    ).catch(error => {
        console.error(error);
    });
}