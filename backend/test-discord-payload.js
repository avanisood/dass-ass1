const event = {
    name: "Test Event",
    description: "Test description",
    type: "normal",
    eligibility: "",
    registrationFee: 0,
    eventStartDate: new Date().toISOString()
};

const organizer = {
    organizerName: "Test Organizer"
};

const embed = {
    embeds: [{
        title: `🎉 New Event: ${event.name}`,
        description: event.description?.substring(0, 200) || 'No description',
        color: event.type === 'normal' ? 0x6B9BC3 : 0xE8C17C,
        fields: [
            { name: 'Type', value: event.type === 'normal' ? 'Normal Event' : 'Merchandise', inline: true },
            { name: 'Eligibility', value: event.eligibility || 'Open to All', inline: true },
            { name: 'Fee', value: event.registrationFee ? `₹${event.registrationFee}` : 'Free', inline: true },
            { name: 'Date', value: new Date(event.eventStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), inline: true },
        ],
        footer: { text: `Posted by ${organizer.organizerName || 'Organizer'}` },
        timestamp: new Date().toISOString(),
    }]
};

console.log(JSON.stringify(embed, null, 2));

async function testFetch() {
    console.log("Mocking a fetch to a dummy endpoint that prints the discord request...");
    // I will just use curl to hit discord API with an invalid webhook to see the response format requirements maybe?
}
testFetch();
