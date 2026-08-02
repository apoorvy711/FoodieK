const express = require("express");

const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

router.post(
  "/",
  /*
    #swagger.tags = ['Categories']
    #swagger.summary = 'Create Category'
  */
  createCategory,
);

router.get(
  "/",
  /*
    #swagger.tags = ['Categories']
    #swagger.summary = 'Get All Categories'
  */
  getCategories,
);

router.get(
  "/:id",
  /*
    #swagger.tags = ['Categories']
    #swagger.summary = 'Get Category Details'
  */
  getCategoryById,
);

router.patch(
  "/:id",
  /*
    #swagger.tags = ['Categories']
    #swagger.summary = 'Update Category'
  */
  updateCategory,
);

router.delete(
  "/:id",
  /*
    #swagger.tags = ['Categories']
    #swagger.summary = 'Delete Category'
  */
  deleteCategory,
);

module.exports = router;
