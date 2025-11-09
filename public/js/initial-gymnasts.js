// Firebase v8 globals já inicializados via firebase-init.js
// ATENÇÃO: Este arquivo usa sintaxe Firebase v9+ e precisa ser convertido para v8 se for usado
// As funções collection(), doc(), writeBatch(), getDocs() precisam ser convertidas para db.collection(), etc.

// Array com os dados iniciais das ginastas (sem IDs ou scores)
const initialGymnasts = [
    // USA
    { name: "Arthur BILES", country: "USA" },
    { name: "Sunisa LEE", country: "USA" },
    { name: "Lima JONES", country: "USA" },
    { name: "Sunshine CAREY", country: "USA" },
    { name: "Sasa BLAKELY", country: "USA" },

    // BRAZIL
    { name: "Victoria HENNA", country: "BRA" },
    { name: "Flávia SARAIVA", country: "BRA" },
    { name: "Jade DOREFORSO", country: "BRA" },
    { name: "Moon OLIVEIRA", country: "BRA" },
    { name: "Júlia SOARES", country: "BRA" },

    // CANADA
    { name: "Matheus BLACK", country: "CAN" },
    { name: "Kate OLSEN", country: "CAN" },
    { name: "Davi STEWART", country: "CAN" },
    { name: "Bacon TRAN", country: "CAN" },
    { name: "Isaac LEE", country: "CAN" },

    // ITALY
    { name: "Enzo FERRARI", country: "ITA" },
    { name: "Luh D'AMATO", country: "ITA" },
    { name: "Vivi D'AMATO", country: "ITA" },
    { name: "Cookie ESPOSITO", country: "ITA" },
    { name: "Alicia VILLA", country: "ITA" },

    // ROMANIA
    { name: "Jason PONOR", country: "ROM" },
    { name: "Neuma MANECA-VOINEA", country: "ROM" },
    { name: "Augusto BARBOSU", country: "ROM" },
    { name: "Isa NISTOR", country: "ROM" },
    { name: "Nicolai IORDACHE", country: "ROM" },

    // CHINA
    { name: "Aliya FANYUWEI", country: "CHN" },
    { name: "Jennie YAQIN", country: "CHN" },
    { name: "Fefe YIHAN", country: "CHN" },
    { name: "Laís QIYUAN", country: "CHN" },
    { name: "Lucas YUSHAN", country: "CHN" },

    // GREAT BRITAIN
    { name: "Flora DOWNIE", country: "GBR" },
    { name: "Karina DOWNIE", country: "GBR" },
    { name: "Nick FENTON", country: "GBR" },
    { name: "Vivi KINSELLA", country: "GBR" },
    { name: "Rebeca EVANS", country: "GBR" },

    // FRANCE
    { name: "Nick DE JESUS", country: "FRA" },
    { name: "Emma BOYER", country: "FRA" },
    { name: "Luana CHARPY", country: "FRA" },
    { name: "Guilherme DEVILLARD", country: "FRA" },
    { name: "Anita OSYSSEK", country: "FRA" }
];

// Função para popular Firestore se estiver vazio
async function initializeFirestoreWAG() {
    console.log('[initial-gymnasts.js] Verificando coleção "new_gymnasts" no Firestore...');
    const gymnastsCol = collection(db, "new_gymnasts");

    try {
        // Verifica se a coleção já tem algum documento
        const q = query(gymnastsCol, limit(1)); // Pega apenas 1 documento para verificar se existe algo
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('[initial-gymnasts.js] Coleção "new_gymnasts" vazia. Inicializando com dados padrão...');

            // Cria um batch para adicionar todos os documentos de uma vez
            const batch = writeBatch(db);
            let count = 0;

            initialGymnasts.forEach((gymnast, index) => {
                // Gera um ID único para o Firestore
                const uniqueId = `initial_${gymnast.country}_${index}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
                const gymnastData = {
                    ...gymnast,
                    id: uniqueId, // Adiciona o ID ao próprio documento
                    scores: {} // Inicializa objeto de scores vazio
                };

                // Cria uma referência para o novo documento com o ID gerado
                const gymnastRef = doc(db, "new_gymnasts", uniqueId);
                // Adiciona a operação de criação ao batch
                batch.set(gymnastRef, gymnastData);
                count++;
            });

            // Envia o batch para o Firestore
            await batch.commit();
            console.log(`[initial-gymnasts.js] Firestore inicializado com ${count} ginastas.`);

        } else {
            console.log('[initial-gymnasts.js] Coleção "new_gymnasts" já contém dados. Nenhuma ação necessária.');
        }
    } catch (error) {
        console.error("[initial-gymnasts.js] Erro ao verificar ou inicializar Firestore:", error);
        alert("Erro ao tentar inicializar os dados das ginastas no banco de dados. Verifique o console.");
    }
}

async function addGymnastWithSimpleId(name, country, db, index) {
    const id = `gym_${index.toString().padStart(3, '0')}`;
    const gymnastData = {
        id,
        name,
        country,
        scores: {}
    };
    const gymnastRef = doc(db, "new_gymnasts", id);
    await setDoc(gymnastRef, gymnastData);
    return id;
}

// Chama a função de inicialização do Firestore quando o script for carregado
// Usar um .then() garante que a inicialização do Firebase no config já ocorreu
// (Embora a natureza do módulo já deva garantir isso)
initializeFirestoreWAG().catch(err => {
    console.error("Falha crítica ao executar initializeFirestoreWAG:", err);
});
