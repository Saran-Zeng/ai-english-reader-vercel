"use client";


import {
create
}
from "zustand";



interface AppState{


currentArticle:string;


setArticle:

(article:string)=>void;


}



export const useStore =

create<AppState>((set)=>(


{


currentArticle:"",


setArticle:(article)=>

set({

currentArticle:article

})


}


));