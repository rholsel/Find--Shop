// tests/product-validator.test.js
import { validateProductPayload } from './product-validation.js';

// Petite fonction maison pour afficher proprement les résultats du test
function assert(testName, condition) {
    if (condition) {
        console.log(`TEST REUSSI : ${testName}`);
    } else {
        console.error(`TEST ECHOUE : ${testName}`);
    }
}

console.log("=== DEBUT DES TEST UNITAIRES DU BACK-END ===\n");

// --- CAS DE TEST 1 : Un produit parfaitement valide ---
const validProduct = {
    name: "Pain de campagne",
    price: 2.50,
    category: "Alimentation",
    stock: 20
};
const result1 = validateProductPayload(validProduct);
assert("Devrait accepter un produit valide", result1.isValid === true && result1.errors.length === 0);


// --- CAS DE TEST 2 : Tricherie sur le prix (prix <= 0) ---
const cheatProductPrice = {
    name: "T-shirt",
    price: -5.00, // Prix négatif interdit
    category: "Habillement",
    stock: 10
};
const result2 = validateProductPayload(cheatProductPrice);
assert("Devrait refuser un prix négatif", result2.isValid === false && result2.errors.includes("Le prix doit être strictement supérieur à 0."));


// --- CAS DE TEST 3 : Erreur de type (String au lieu de Number) ---
const wrongTypeProduct = {
    name: "Service Réparation",
    price: "dix euros", // Type string au lieu de number
    category: "Services",
    stock: 1
};
const result3 = validateProductPayload(wrongTypeProduct);
assert("Devrait détecter un mauvais type pour le prix", result3.isValid === false && result3.errors.includes("Le prix doit être un nombre."));


// --- CAS DE TEST 4 : Stock négatif ---
const negativeStockProduct = {
    name: "Vase en poterie",
    price: 15.00,
    category: "Artisanat",
    stock: -2 // Stock impossible
};
const result4 = validateProductPayload(negativeStockProduct);
assert("Devrait refuser un stock négatif", result4.isValid === false && result4.errors.includes("Le stock ne peut pas être négatif."));


console.log("\n=== FIN DES TESTS ===");