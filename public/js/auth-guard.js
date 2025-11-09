// Script de proteção de autenticação
// Deve ser incluído em todas as páginas que precisam de autenticação

// Flag para controlar logout intencional
let isLoggingOut = false;

// Configuração de permissões por página
const pagePermissions = {
    'edit-scores-qualifiers.html': ['admin'],
    'edit-scores-team-final.html': ['admin'],
    'edit-scores-aa-final.html': ['admin'],
    'edit-scores-vt-final.html': ['admin'],
    'edit-scores-ub-final.html': ['admin'],
    'edit-scores-bb-final.html': ['admin'],
    'edit-scores-fx-final.html': ['admin'],
    'start-list-qualifiers.html': ['admin'],
    'start-list-team-final.html': ['admin'],
    'start-list-aa-final.html': ['admin'],
    'start-list-vt-final.html': ['admin'],
    'start-list-ub-final.html': ['admin'],
    'start-list-bb-final.html': ['admin'],
    'start-list-fx-final.html': ['admin'],
    'control.html': ['admin'],
    'judges-panel.html': ['admin', 'judge_d', 'judge_e', 'jurado_d', 'jurado_e'],
    'dashboard.html': ['admin'],
    'judges-d.html': ['judge_d', 'jurado_d'],
    'judges-e.html': ['judge_e', 'jurado_e']
};

// Função para buscar role do usuário no Firebase
async function getUserRole(user) {
    try {
        console.log('🔍 Auth-guard buscando role para:', user.email);
        
        // Primeiro tenta buscar por UID
        let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.log('📧 Tentando buscar por email');
            // Se não encontrar por UID, tenta por email
            const emailQuery = await firebase.firestore().collection('users').where('email', '==', user.email).get();
            if (!emailQuery.empty) {
                userDoc = emailQuery.docs[0];
            }
        }
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('✅ Role encontrada:', userData.role);
            return userData.role;
        }
        
        console.log('❌ Usuário não encontrado na collection users');
        return null;
    } catch (error) {
        console.error('💥 Erro ao buscar role:', error);
        return null;
    }
}

// Função para verificar permissões
async function checkPagePermissions(userRole) {
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('🔒 Verificando permissões para página:', currentPage, 'Role:', userRole);
    
    if (pagePermissions[currentPage]) {
        if (!pagePermissions[currentPage].includes(userRole)) {
            console.log('❌ Acesso negado para role:', userRole);
            alert('Acesso negado. Você não tem permissão para acessar esta página.');
            
            // Redirecionar baseado na role
            if (userRole === 'admin') {
                window.location.href = 'dashboard.html';
            } else if (userRole === 'judge_d' || userRole === 'jurado_d') {
                window.location.href = 'judges-d.html';
            } else if (userRole === 'judge_e' || userRole === 'jurado_e') {
                window.location.href = 'judges-e.html';
            } else {
                window.location.href = 'login.html';
            }
            return false;
        }
    }
    
    console.log('✅ Acesso permitido');
    return true;
}

// Verificar autenticação
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
        // Se estamos fazendo logout intencional, não interferir
        if (isLoggingOut) {
            return;
        }
        
        // Usuário não está logado
        console.log('🚫 Usuário não logado, redirecionando para login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('👤 Usuário logado:', user.email);
    
    // Buscar role do usuário
    const userRole = await getUserRole(user);
    
    if (!userRole) {
        console.log('❌ Usuário sem role válida, fazendo logout');
        await firebase.auth().signOut();
        window.location.href = 'login.html';
        return;
    }
    
    // Salvar informações no localStorage para compatibilidade
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userEmail', user.email);
    
    // Verificar permissões da página
    await checkPagePermissions(userRole);
});

// Função para obter informações do usuário atual
function getCurrentUser() {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    return {
        email: email,
        role: role,
        isAdmin: role === 'admin',
        isJudgeD: role === 'judge_d' || role === 'jurado_d',
        isJudgeE: role === 'judge_e' || role === 'jurado_e'
    };
}

// Função para fazer logout
async function logout() {
    try {
        console.log('🚪 Fazendo logout...');
        
        // Marcar que estamos fazendo logout intencional
        isLoggingOut = true;
        
        // Limpar localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        
        // Fazer logout no Firebase
        await firebase.auth().signOut();
        
        // Redirecionar para login
        window.location.href = 'login.html';
    } catch (error) {
        console.error('💥 Erro ao fazer logout:', error);
        // Mesmo com erro, redirecionar para login
        window.location.href = 'login.html';
    }
}

// Expor funções globalmente para compatibilidade
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.checkPagePermissions = checkPagePermissions;
window.getUserRole = getUserRole;

console.log('🔒 Auth-guard inicializado');
