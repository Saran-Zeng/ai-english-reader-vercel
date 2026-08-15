import SentenceCard from "./SentenceCard";


export default function ArticleViewer(){


const demo = [

"Artificial intelligence is changing the world.",

"Learning English with AI is becoming easier."

];


return (

<div>


<h2>
文章分析
</h2>



{

demo.map(

(sentence,index)=>(

<SentenceCard

key={index}

sentence={sentence}

/>

)

)

}



</div>

)


}