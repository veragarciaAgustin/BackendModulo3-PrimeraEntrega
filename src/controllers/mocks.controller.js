import MockingService from "../services/mocking.js";
import { faker } from "@faker-js/faker";
import User from "../dao/models/User.js";
import Pet from "../dao/models/Pet.js";

// Generar usuarios ficticios
const generateUsers = async (count) => {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: "user",
        });
    }
    return User.insertMany(users);
};

// Generar mascotas ficticias
const generatePets = async (count, userIds) => {
    const pets = [];
    for (let i = 0; i < count; i++) {
        const randomUser = userIds[Math.floor(Math.random() * userIds.length)];
        pets.push({
            name: faker.name.firstName(),
            specie: faker.animal.type(),
            birthDate: faker.date.past(10, new Date()),
            adopted: faker.datatype.boolean(),
            owner: randomUser,
            image: faker.image.animals(),
        });
    }
    return Pet.insertMany(pets);
};

// Endpoint para generar datos
const generateData = async (req, res) => {
    const { users = 0, pets = 0 } = req.body;

    if (isNaN(users) || isNaN(pets)) {
        return res.status(400).json({ error: "Los parámetros 'users' y 'pets' deben ser números." });
    }

    try {
        // Generar usuarios
        const createdUsers = await generateUsers(Number(users));
        const userIds = createdUsers.map(user => user._id);

        // Generar mascotas y asignarlas a usuarios
        const createdPets = await generatePets(Number(pets), userIds);

        // Actualizar usuarios con las mascotas asignadas
        await Promise.all(
            createdPets.map(async pet => {
                await User.findByIdAndUpdate(pet.owner, {
                    $push: { pets: { _id: pet._id } }
                });
            })
        );

        res.status(201).json({
            message: "Datos generados exitosamente.",
            usersInserted: createdUsers.length,
            petsInserted: createdPets.length,
        });
    } catch (error) {
        console.error("Error al generar datos:", error);
        res.status(500).json({ error: "Ocurrió un error al generar los datos." });
    }
};


const getMockingPets = async (req, res) => {
    const pets = await MockingService.generateMockingPets(100); 
    res.send({status: "success", payload: pets}); 
}

const getMockingUsers = async (req, res) => {
    const users = await MockingService.generateMockingUsers(50); 
    res.send({status: "success", payload: users});
}

export default {
    generateData,
    getMockingPets,
    getMockingUsers
}