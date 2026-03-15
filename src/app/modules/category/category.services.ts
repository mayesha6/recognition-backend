import { Category } from "./category.model"

const createCategory = async (payload:any) => {

 const category = await Category.create(payload)

 return category

}

const getCategories = async () => {

 return await Category.find()

}

const addImages = async (
 categoryId:string,
 images:string[]
) => {

 const category = await Category.findByIdAndUpdate(
  categoryId,
  {
   $push:{
    images:{ $each:images }
   }
  },
  { new:true }
 )

 return category

}

const deleteImage = async (
 categoryId:string,
 imageUrl:string
) => {

 const category = await Category.findByIdAndUpdate(
  categoryId,
  {
   $pull:{
    images:imageUrl
   }
  },
  { new:true }
 )

 return category

}

export const CategoryService = {

 createCategory,
 getCategories,
 addImages,
 deleteImage

}