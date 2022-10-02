import * as cheerio from "cheerio";
import fetch from "isomorphic-fetch";
import fs from "fs";

interface IDrink {
  name: string;
  ingredients: Array<string>;
  method: string;
  garnish: Array<string>;
}

const parseData = async () => {
  const response = await fetch("https://iba-world.com/category/iba-cocktails/");

  const data = await response.text();

  const $ = cheerio.load(data); // load the page response into the cheerio html object

  // build array of urls to each IBA drink
  const urls: Array<string> = [];

  $(".entry-title").each(function () {
    const elements = $(this);
    if (elements.length > 0) {
      const element = elements[0];
      if (element && element.children && element.children.length > 0) {
        const url = $(element.children[0]).attr("href");
        if (url !== undefined) {
          urls.push(url);
          // useful for debugging
          //   console.log(url);
        }
      }
    }
  });

  // for each url in the array, fetch the page and parse both the ingredient and method data
  const drinks = [];
  for (const url of urls) {
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);

    const ingredients = $($("h3").next()[0]).text().split("\n");
    const sizedIngredients = ingredients
      .map((ingredient) => {
        if (ingredient === "") {
          return undefined;
        }
        if (ingredient.includes("ml")) {
          return {
            unit: "ml",
            amount: ingredient.split(" ml ")[0],
            ingredient: ingredient.split(" ml ")[1],
          };
        }
        if (ingredient.includes("Dashes")) {
          return {
            unit: "dash",
            amount: ingredient.split(" Dashes ")[0],
            ingredient: ingredient.split(" Dashes ")[1],
          };
        }
        if (ingredient.includes("dashes")) {
          return {
            unit: "dash",
            amount: ingredient.split(" dashes ")[0],
            ingredient: ingredient.split(" dashes ")[1],
          };
        }
        if (ingredient.includes("dash")) {
          return {
            unit: "dash",
            amount: ingredient.split(" dash ")[0],
            ingredient: ingredient.split(" dash ")[1],
          };
        }
        if (ingredient.includes("teaspoons")) {
          return {
            unit: "teaspoon",
            amount: ingredient.split(" teaspoons ")[0],
            ingredient: ingredient.split(" teaspoons ")[1],
          };
        }
        if (ingredient.includes("Bar Spoon")) {
          return {
            unit: "bar spoon",
            amount: ingredient.split(" Bar Spoon ")[0],
            ingredient: ingredient.split(" Bar Spoon ")[1],
          };
        }
        if (ingredient.includes("Drops")) {
          return {
            unit: "drop",
            amount: ingredient.split(" Drops ")[0],
            ingredient: ingredient.split(" Drops ")[1],
          };
        }
        if (ingredient.includes("drops")) {
          return {
            unit: "drop",
            amount: ingredient.split(" drops ")[0],
            ingredient: ingredient.split(" drops ")[1],
          };
        }
        if (ingredient.includes("splash")) {
          return {
            unit: "splash",
            amount: ingredient.split(" splash ")[0],
            ingredient: ingredient.split(" splash ")[1],
          };
        }
        return {
          unit: "",
          amount: "",
          ingredient: ingredient,
        };
      })
      .filter((ingredient) => ingredient !== undefined);

    // useful for debugging
    // console.log({
    //   name: $("h1").text(),
    //   ingredients: sizedIngredients,
    //   method: $($("h3").next()[1]).text(),
    //   garnish: $($("h3").next()[2]).text().split(" and "),
    // });
    drinks.push({
      name: $("h1").text(),
      ingredients: sizedIngredients,
      method: $($("h3").next()[1]).text(),
      garnish: $($("h3").next()[2]).text().split(" and "),
    });
  }
  fs.writeFileSync("drinks.json", JSON.stringify(drinks, null, 2));
  console.log(JSON.stringify(drinks));
  console.log("Wrote data to drinks.json");
};

parseData();
