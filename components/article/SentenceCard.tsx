interface Props{

sentence:string;

}



export default function SentenceCard({

sentence

}:Props){



return (

<div>


<h3>
英文句子
</h3>


<p>

{sentence}

</p>



</div>

)

}