interface Props {

params:{
id:string;
}

}


export default function NoteDetailPage({
params
}:Props){


return (

<main className="p-10">


<h1 className="text-3xl font-bold">
Note {params.id}
</h1>


<p className="mt-4">
AI generated learning notes.
</p>


</main>

);


}