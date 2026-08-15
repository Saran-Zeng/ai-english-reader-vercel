"use client";


import {
useState
}
from "react";



export function useArticle(){


const [
loading,
setLoading
]
=
useState(false);



async function analyze(

article:string

){


setLoading(true);



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

article

})

}

);



const data =
await res.json();



setLoading(false);



return data;


}



return {

analyze,

loading

};


}