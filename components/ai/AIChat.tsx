"use client";


import {useState} from "react";



export default function AIChat(){


const [question,setQuestion]=useState("");



return (

<div>


<h3>
AI英语老师
</h3>



<input

value={question}

onChange={(e)=>setQuestion(e.target.value)}

placeholder="询问AI..."

/>



<button

className="primary-btn"

>

发送

</button>



</div>

)

}