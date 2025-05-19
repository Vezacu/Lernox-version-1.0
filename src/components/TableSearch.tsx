"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";

const TableSearch = () => {

const router = useRouter()
//handle submit is activated once user inputs data in search bar
const handleSubmit = (e:React.FormEvent<HTMLFormElement>) => {

 e.preventDefault();
 //It gets the search input value using e.currentTarget[0] (where [0] is the input field).
 const value = (e.currentTarget[0] as HTMLInputElement).value;
 

  const params = new URLSearchParams(window.location.search);//fetches the input datas
  params.set("search",value); // Add search term to URL
  router.push(`${window.location.pathname}?${params}`);  // Update URL
};

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default TableSearch;
