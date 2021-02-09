var database = firebase.database();

saldo_atual();

extrato_historico();

//BOTOES
function clicou(tipo) {
    console.log('clicou ' + tipo);
    //muda de bottão para input
    document.getElementById(tipo + '_div').innerHTML = '<input id="'+tipo+'_input" type="number" placeholder="insira Enter após digitar o valor" onblur=" voltar(\'' + tipo +'\')" onkeypress="teclou(event,this,\''+tipo+'\')" />';
    //foca no input
    document.getElementById(tipo + '_input').focus();

}


function voltar(tipo) {
    console.log('voltou ' + tipo);
    //muda de input para botão
    document.getElementById(tipo + '_div').innerHTML = '<input id="botao_'+tipo+'" type="button" value="' + tipo.toUpperCase() + '" onclick="clicou(\'' + tipo+'\')"/>';
}

function teclou(e, texto, tipo) {
    var codigo = (e.keyCode ? e.keyCode : e.which);
    //se apertar enter
    if (codigo == 13) {
        var valor_digitado = parseFloat(document.getElementById(tipo + '_input').value).toFixed(2);

        //se o valor for numero
        if ($.isNumeric(valor_digitado)) {
            if (valor_digitado > 0) {
                //enviar dados
                contar_enviar_firebase(tipo, valor_digitado);
            } else {
                alert('DIGITE UM VALOR ACIMA DE ZERO');
            }


            
        } else {
            alert('DIGITE APENAS NÚMEROS');
        }

        //tira o foco após digitação
        $('#' + tipo + '_input').blur();

    }

    

}



//FIREBASE
function saldo_atual() {
    
    var ref = database.ref('saldo');
    ref.on('value', pegar_dados);

    function pegar_dados(dados) {
        //pegando saldo de dados
        var saldo = parseFloat(dados.val()).toFixed(2);

        if (saldo == 0) {
            //se saldo for zero
            document.getElementById('saldo').innerHTML = "<a style= \"color:grey;\">R$ 0.00</a>";
        } else {
            //pagina recebe saldo
            if (saldo < 0) {
                //se estiver negativo
                document.getElementById('saldo').innerHTML = "<a style= \"color:red;\">R$ " + saldo + "</a>";
            } else {
                document.getElementById('saldo').innerHTML = "<a style= \"color:green;\">R$ " + saldo + "</a>";
            }
        }

        
    }

}


function extrato_historico() {
    var ref = database.ref('extrato');
    ref.on('value', pegar_dados);
    
    function pegar_dados(dados) {
        //limpa ultimo historico
        $('#extrato_historico').html('');
        //coloca dados em um array
        var extratos = Object.values(dados.val());

        //corre pelo array de tras para frente
        for (var x = extratos.length-1; x>=0; x--) {
            if (extratos[x]['tipo'][0] == 'S') {
                //se sacou, extrato vermelho
                $('#extrato_historico').append('<tr style="color: red"> <td>' + extratos[x]['tipo'] + '</td> <td>R$ '+extratos[x]['valor']+'</td> <td>'+extratos[x]['dia']+'</td> <td>'+extratos[x]['hora']+'</td>  <td> <img id="view_comprovante" onclick="enviar_local_recibo('+x+')"  src="view.png"/>  </td></tr>');
            } else {
                //se depositou, extrato verde
                $('#extrato_historico').append('<tr style="color: green"> <td>' + extratos[x]['tipo'] + '</td> <td>R$ ' + extratos[x]['valor'] + '</td> <td>' + extratos[x]['dia'] + '</td> <td>' + extratos[x]['hora'] + '</td>  <td> <img id="view_comprovante" onclick="enviar_local_recibo(' + x + ')" src="view.png"/>  </td></tr>');
            }
            
        }
    }

    

}


function contar_enviar_firebase(tipo, valor) {
    console.log('tipo: ' + tipo + '\nvalor: ' + valor);

    var ref = database.ref('cont_extrato');
    ref.once('value', pegar_dados);

    function pegar_dados(dados) {
        //pega contagem de extratos
        enviar_firebase(tipo, valor, dados.val());
    }




}

function verbo_passado(tipo) {
    var tipo_str;
    if (tipo == 'depositar') {
        tipo_str = 'Depositou ';
    } else {
        tipo_str = 'Sacou ';
    }
    return tipo_str;
}

function enviar_firebase(tipo, valor, cont) {
    //cria variavel com verbo no passado
    var tipo_str = verbo_passado(tipo);

    //pega tempo atual
    var d = new Date;
    //dia atual
    var dia = d.getDate() + ' / ' + (d.getMonth() + 1) + ' / ' + d.getFullYear();
    //hora atual
    var hora = d.getHours() + ' : ' + d.getMinutes() + ' : ' + d.getSeconds();

    var ref = database.ref();

    //adiciona recibo a extratos
    ref.child('extrato/extrato_' + cont).set({
        tipo: tipo_str,
        valor: valor,
        dia: dia,
        hora: hora
    });

    //aumenta contagem
    cont++;
    //envia contagem
    ref.child('cont_extrato').set(cont);
    //muda saldo do firebase
    mudar_saldo(tipo, valor);


}

function mudar_saldo(tipo, valor) {
    var ref = database.ref('saldo');
    ref.once('value', pegar_dados);

    function pegar_dados(ant_saldo) {

        if (tipo == 'depositar') {
            //aumenta valor de antigo saldo
            database.ref().child('saldo').set(parseFloat(ant_saldo.val()) + parseFloat(valor));
        } else {
            if (tipo == 'sacar') {
                //desconta valor de antigo saldo
                database.ref().child('saldo').set(parseFloat(ant_saldo.val()) - parseFloat(valor));
            } else {
                //mensagem de erro
                console.log('algo occoreu errado ao mudar de saldo');
            }
        }
        
    }

}

//PDF
function gerarPDF(){
    //escolhendo elemento
    const elemento = document.getElementById('recibo');
    //fazendo download
    html2pdf().from(elemento).save();
    
}


function enviar_local_recibo(x) {
    var ref = database.ref('extrato/extrato_'+(x+200));
    ref.once('value', pegar_dados);

    function pegar_dados(extrato) {
        //colocando informações em uma array
        var dados_extrato = Object.values(extrato.val());
        //escrevendo recibo na tela
        escrever_local_recibo(dados_extrato[0], dados_extrato[1], dados_extrato[2], dados_extrato[3]);
    }

}


function escrever_local_recibo(dia, hora, tipo, valor) {
    //mostra local do recibo 
    $('#local_recibo').css('visibility', 'visible');

    //limpa local do recibo
    $('#recibo').html('');
    //adiciona conteudo
    $('#recibo').append('<table id="table_recibo">' +
        //linha 1
        '<tr><td>' + tipo + '</td><td>R$ ' + valor + '</td></tr>' +
        //linha 2
        '<tr><td>Dia</td><td>' + dia + '</td></tr>' +
        //linha 3
        '<tr><td>Horário</td><td>'+hora+'</td></tr>'+
        '</table > ');

}


//ao clicar no botao download
$('#download_img').click(
    function () {

        //selecionando elemento
        const elemento = document.getElementById('recibo');
        //fazendo download do pdf
        html2pdf().from(elemento).save();
    }
);
    
