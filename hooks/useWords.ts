"use client";


import {
useState
}
from "react";



export function useWords(){


const [
words,
setWords
]
=
useState<string[]>([]);



function addWord(word:string){


setWords(

old=>

[

...old,

word

]

);


}



return {

words,

addWord

};


}