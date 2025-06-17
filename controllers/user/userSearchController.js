const CanteenMenuItem = require('../../models/CanteenMenuItem');
const Product = require('../../models/Product'); // Assuming you have a Product model
const mongoose = require('mongoose');

// @desc    Get popular menu items
// @route   GET /user/menu/popular
// @access  Public
const fetchPopularItems = async (req, res) => {
  try {
    // Get popular items with additional filters and better sorting
    const popularItems = await CanteenMenuItem.aggregate([
      {
        $match: {
          isAvailable: true,
          totalOrders: { $gt: 0 }, // Only include items that have been ordered
          // Additional optional filters could be added here
          // like category filters or price range filters
        }
      },
      {
        $lookup: {
          from: 'products', // Changed from 'product' to match your other function
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'canteens',
          localField: 'canteenId',
          foreignField: '_id',
          as: 'canteenDetails'
        }
      },
      { $unwind: '$canteenDetails' },
      {
        $addFields: {
          // Calculate popularity score combining orders and revenue
          popularityScore: {
            $add: [
              { $multiply: ['$totalOrders', 0.7] }, // Weight orders more
              { $multiply: ['$totalRevenue', 0.3] }  // Weight revenue less
            ]
          },
          // Calculate average rating if available
          averageRating: { $ifNull: ['$productDetails.averageRating', 0] }
        }
      },
      {
        $sort: { 
          popularityScore: -1,  // Primary sort by calculated score
          averageRating: -1,    // Then by rating
          totalOrders: -1,     // Then by raw order count
          totalRevenue: -1      // Then by revenue
        }
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          discountedPrice: {  // Calculate final price after offers
            $cond: {
              if: { $gt: ['$offers.discount', 0] },
              then: { $subtract: ['$price', '$offers.discount'] },
              else: '$price'
            }
          },
          preparationTime: 1,
          deliveryTime: 1,
          offers: 1,
          images: '$productDetails.images',
          category: '$productDetails.category', // Added category
          tags: '$productDetails.tags',       // Added tags
          canteenId: 1,
          canteenName: '$canteenDetails.name',
          canteenLogo: '$canteenDetails.logo', // Added canteen logo
          totalOrders: 1,
          totalRevenue: 1,
          averageRating: 1,  // Include average rating
          isVeg: '$productDetails.isVeg' // Added dietary info
        }
      }
    ]);

    res.json({
      success: true,
      count: popularItems.length,
      data: popularItems,
      lastUpdated: new Date() // Add timestamp for caching purposes
    });
  } catch (err) {
    console.error('Error fetching popular items:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Search menu items
// @route   GET /user/menu/search
// @access  Public
const debouncedSearch = async (req, res) => {
  try {
    const { q: query } = req.query;
    const { canteenId } = req.params;

    if (!query?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a search query",
      });
    }

    const escapeRegex = (str) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const escapedQuery = escapeRegex(query);
    const startsWithRegex = new RegExp(`^${escapedQuery}`, "i");
    const containsRegex = new RegExp(escapedQuery, "i");

    const searchResults = await CanteenMenuItem.aggregate([
      {
        $match: {
          canteenId: new mongoose.Types.ObjectId(canteenId),
          isAvailable: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "canteens",
          localField: "canteenId",
          foreignField: "_id",
          as: "canteenDetails",
        },
      },
      { $unwind: "$canteenDetails" },
      {
        $match: {
          $or: [
            { name: { $type: "string", $regex: startsWithRegex } },
            { "productDetails.name": { $type: "string", $regex: startsWithRegex } },
            { name: { $type: "string", $regex: containsRegex } },
            { "productDetails.name": { $type: "string", $regex: containsRegex } },
            { "productDetails.category": { $type: "string", $regex: startsWithRegex } },
            { "productDetails.category": { $type: "string", $regex: containsRegex } },
            { "productDetails.description": { $type: "string", $regex: containsRegex } },
            { "offers.offerType": { $type: "string", $regex: containsRegex } },
            { "canteenDetails.name": { $type: "string", $regex: containsRegex } },
            { "productDetails.tags": { $elemMatch: { $type: "string", $regex: containsRegex } } },
            { "productDetails.ingredients": { $elemMatch: { $type: "string", $regex: containsRegex } } }
          ]
        }
      },
      {
        $addFields: {
          relevanceScore: {
            $sum: [
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$name", null] },
                      { $eq: [{ $type: "$name" }, "string"] },
                      { $regexMatch: { input: "$name", regex: startsWithRegex } }
                    ]
                  },
                  100,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$productDetails.name", null] },
                      { $eq: [{ $type: "$productDetails.name" }, "string"] },
                      { $regexMatch: { input: "$productDetails.name", regex: startsWithRegex } }
                    ]
                  },
                  100,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$name" }, "string"] },
                      { $regexMatch: { input: "$name", regex: containsRegex } }
                    ]
                  },
                  50,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$productDetails.name" }, "string"] },
                      { $regexMatch: { input: "$productDetails.name", regex: containsRegex } }
                    ]
                  },
                  50,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$productDetails.category" }, "string"] },
                      { $regexMatch: { input: "$productDetails.category", regex: startsWithRegex } }
                    ]
                  },
                  40,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$productDetails.category" }, "string"] },
                      { $regexMatch: { input: "$productDetails.category", regex: containsRegex } }
                    ]
                  },
                  20,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$productDetails.description" }, "string"] },
                      { $regexMatch: { input: "$productDetails.description", regex: containsRegex } }
                    ]
                  },
                  5,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$offers.offerType" }, "string"] },
                      { $regexMatch: { input: "$offers.offerType", regex: containsRegex } }
                    ]
                  },
                  5,
                  0
                ]
              },
              {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$canteenDetails.name" }, "string"] },
                      { $regexMatch: { input: "$canteenDetails.name", regex: containsRegex } }
                    ]
                  },
                  10,
                  0
                ]
              },
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$productDetails.tags", []] },
                    as: "tag",
                    cond: {
                      $and: [
                        { $eq: [{ $type: "$$tag" }, "string"] },
                        { $regexMatch: { input: "$$tag", regex: containsRegex } }
                      ]
                    }
                  }
                }
              },
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$productDetails.ingredients", []] },
                    as: "ing",
                    cond: {
                      $and: [
                        { $eq: [{ $type: "$$ing" }, "string"] },
                        { $regexMatch: { input: "$$ing", regex: containsRegex } }
                      ]
                    }
                  }
                }
              },
              { $cond: ["$isAvailable", 5, 0] }
            ]
          }
        }
      },
      {
        $sort: {
          relevanceScore: -1,
          "productDetails.name": 1,
          "canteenDetails.name": 1
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          stock: 1,
          isAvailable: 1,
          preparationTime: 1,
          deliveryTime: 1,
          image: "$productDetails.image",
          canteenName: "$canteenDetails.name",
          canteenId: "$canteenDetails._id",
          description: "$productDetails.description",
          tags: "$productDetails.tags",
          category: "$productDetails.category",
          ingredients: "$productDetails.ingredients",
          allergens: "$productDetails.allergens",
          offerType: "$offers.offerType",
          offerDiscount: "$offers.discount",
          availability: 1,
          relevanceScore: 1
        },
      },
      { $limit: 20 }
    ]);

    return res.json({
      success: true,
      count: searchResults.length,
      data: searchResults,
    });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};



function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
  

module.exports = {
  fetchPopularItems,
  debouncedSearch
};