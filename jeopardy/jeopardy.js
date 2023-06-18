// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    const result = [];
    // Checks if a category id is present in the result array.
    const isInResult = categoryID => result.includes(categoryID);
    const hasMoreThan4Clues = cate => cate.category.clues_count >= 5;
    // Access API until categories array has 6 unique id elements.
    while(result.length < 6) {
        // Variables that get a random clue from API and then access the object within the array.
        let randomCategory = await axios.get('http://jservice.io/api/random');
        let Category = randomCategory.data[0];
        // Pushes unique ids into result array.
        if(!(isInResult(Category.category_id)) && hasMoreThan4Clues(Category)) {
            result.push(Category.category_id);
        }
    }

    return result;
}
/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    const category = await axios.get(`http://jservice.io/api/category?id=${catId}`);
    const categoryObj = category.data;
    const categoryClues = categoryObj.clues.splice(0,5);
    const resultObj = {'title' : categoryObj.title, 'clues' : []};
    
    for(let clue of categoryClues) {
        resultObj.clues.push({
            'question' : clue.question, 
            'answer': clue.answer, 
            'showing': null});
    }

    return resultObj;
}
/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

function fillTable(categoryArr) {
    // Creates basic table and sections
    $('.container').prepend('<table id="game-board"><thead id="categories"><tr></tr></thead><tbody id="clues"><tr class="row-0"></tr><tr class="row-1"></tr><tr class="row-2"></tr><tr class="row-3"></tr><tr class="row-4"></tr></tbody></table>');
    // Loop to create unique categories
    for(let i = 0; i < categoryArr.length; i++) {
        const categoryName = categoryArr[i].title;
        const x = i;
        $('#categories').append(`<td class="category">${categoryName}</td>`);
        for(let j = 0; j < 5; j++) {
            const y = j;
            $(`.row-${j}`).append(`<td class="clue" id="${x}-${y}">?</td>`);
            $(`#${x}-${y}`).data("clueData", categoryArr[i].clues[j]);
        }
    }
}

async function fillCategories() {
    const idArr = await getCategoryIds();
    for(let category of idArr) {
        categories.push(await getCategory(category));
    }
};

function clearCategories() {
    while(categories.length > 0) {
        categories.pop();
    };
};
/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    const evtTarget = evt.target;
    const targetId = evtTarget.id;

    const isClue = () => evtTarget.classList.value === 'clue';
    const isDefault = () => $(`#${targetId}`).data('clueData').showing === null;
    const isQuestion = () => $(`#${targetId}`).data('clueData').showing === 'question';

    if(isClue()) {
        if(isDefault()) {
            $(`#${targetId}`).data('clueData').showing = 'question';
            $(`#${targetId}`).text($(`#${targetId}`).data('clueData').question);
        } else if(isQuestion()) {
            $(`#${targetId}`).data('clueData').showing = 'answer';
            $(`#${targetId}`).text($(`#${targetId}`).data('clueData').answer);
        } else {
            return 'Currently displaying answer.'
        }
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
    clearCategories();
    $('.loading-screen').show();
    $('#game-board').remove();
    $('#start-button').text('Restart Game');
}
/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
    $('.loading-screen').hide();
}
hideLoadingView();
/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    await fillCategories();
    fillTable(categories); 
}

/** On click of start / restart button, set up game. */
$('.container').on('click', 'button', e => {
    showLoadingView();
    setupAndStart();
    setTimeout(hideLoadingView, 6000);
});
/** On page load, add event handler for clicking clues */
$('.container').on('click', 'td', handleClick);
