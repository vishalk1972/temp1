const { PrismaClient: PrismaClientLive } = require('@prisma-live/client');
const { PrismaClient: PrismaClientDev } = require('@prisma-dev/client');

const liveDb = new PrismaClientLive();
const devDb = new PrismaClientDev();
const categoryTableData = async (req, res) => {
  try {
    const data = req.body;
    const categories = data.categories;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const mainCategoryName = category.name;
      const subcategoryArray = category.subcategories;
      // check if main category already exist;
      const check=await devDb.Category.findUnique({
        where:{
            name:mainCategoryName
        }
      })
      let mainCategory;
      if(!check)
      {
          // Create main category first
          mainCategory = await devDb.Category.create({
            data: {
              name: mainCategoryName,
            }
          });
      }
      else{
        mainCategory=check
      }

      let subcategoryIds = [];

      for (let j = 0; j < subcategoryArray.length; j++) {
        const eachSubcategoryName = subcategoryArray[j];

        // check if subcategory already exists
        const check=await devDb.Subcategory.findUnique({
            where:{
                name:eachSubcategoryName
            }
        })
        if(!check)
        {
            const subcategory = await devDb.Subcategory.create({
                data: {
                  name: eachSubcategoryName,
                  categoryId: mainCategory.id
                }
              });

              subcategoryIds.push(subcategory.id);
        }
        else{
            subcategoryIds.push(check.id);
        }

      }

      // Update main category with subcategory IDs
      await devDb.Category.update({
        where: {
          id: mainCategory.id
        },
        data: {
          subcategoryIds: subcategoryIds
        }
      });
    }

    // Fetch data with relations included
    const dataOfCategories = await devDb.Category.findMany({
      include: {
        subcategories: true,
      }
    });

    const dataOfSubcategories = await devDb.Subcategory.findMany({
      include: {
        categories: true,
      }
    });

    // console.log(dataOfCategories);
    // console.log(dataOfSubcategories)

    res.json({
      success: true,
      message: 'Data of category and subcategory added successfully',
      dataOfCategories: dataOfCategories,
      dataOfSubcategories: dataOfSubcategories,
    });
  } catch (error) {
    console.error(error);
    liveDb.$disconnect();
    devDb.$disconnect();
    res.json({
      success: false,
      message: error.message ? error.message : "There is an error",
    });
  }finally {
    liveDb.$disconnect();
    devDb.$disconnect();
  }
};

module.exports = categoryTableData;
