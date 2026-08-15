interface Props {

children:React.ReactNode;

onClick?:()=>void;

}


export default function Button({

children,
onClick

}:Props){


return (

<button

className="primary-btn"

onClick={onClick}

>

{children}

</button>

)

}