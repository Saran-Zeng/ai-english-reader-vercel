"use client";


export function useAI(){



async function ask(

question:string

){


const res =
await fetch(
"/api/analyze",
{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:JSON.stringify({

article:question

})

}

);



return await res.json();


}



return {

ask

};


}