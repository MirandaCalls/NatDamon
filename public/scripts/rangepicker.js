class RangePicker {
    constructor(openBtn, applyCallback = null) {
        this.openBtn = openBtn;
        this.applyCallback = applyCallback;

        this.container = document.getElementById(openBtn.dataset.id);
        this.rangeSelector = this.container.querySelector('.range-type-select');
        this.startInput = this.container.querySelector('.timerange-start');
        this.stopInput = this.container.querySelector('.timerange-stop');
        this.applyBtn = this.container.querySelector('.dropdown__apply-btn');

        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.onBodyClick = this.onBodyClick.bind(this);
        this.applyNewRange = this.applyNewRange.bind(this);
        this.setupHandlers();
    }

    setupHandlers() {
        this.openBtn.addEventListener('click', this.toggleDropdown);
        this.rangeSelector.addEventListener('change', this.onRangeTypeUpdate);
        this.startInput.addEventListener('change', (evt) => {
            this.validateDatetimeInput(evt.target);
        });
        this.stopInput.addEventListener('change', (evt) => {
            this.validateDatetimeInput(evt.target);
        });
        this.applyBtn.addEventListener('click', this.applyNewRange);
    }

    toggleDropdown(evt) {
        evt.stopPropagation();
        var dropdown = this.container;
        var is_open = dropdown.style.display == 'block';
        if (is_open) {
            this.setOpenState(false);
        } else {
            this.setOpenState(true);
        }
    }

    setOpenState(open) {
        var body = document.getElementsByTagName('html')[0];
        var dropdown = this.container;
        if (open) {
            // Open the picker
            dropdown.style.display = 'block';
            body.addEventListener('click', this.onBodyClick, false);
        } else {
            // Close the picker
            dropdown.style.display = 'none';
            body.removeEventListener('click', this.onBodyClick, false);
        }
    }

    onBodyClick(evt) {
        if (evt.target.closest('.dropdown')) {
            return;
        }

        this.setOpenState(false);
    }

    onRangeTypeUpdate(evt) {
        var select = evt.target;
        var custom_range_div = select.nextElementSibling;
        if (select.value == "custom") {
            // Display the custom input fields
            custom_range_div.style.display = "block";
        } else {
            // Hide the fields
            custom_range_div.style.display = "none";
        }
    }

    validateDatetimeInput(input) {
        if (input.reportValidity()) {
            input.closest('.text-input').classList.remove('invalid');
            return true;
        } else {
            input.closest('.text-input').classList.add('invalid');
            return false;
        }
    }

    collectRangeData() {
        var type = this.rangeSelector.value;
        var range;
        var mDayStart = moment().startOf('day');
        if (type == 'today') {
            range = {
                type: 'today',
                start: mDayStart.clone(),
                stop: mDayStart.clone().add(1, 'days')
            };
        } else if (type == '3days') {
            range = {
                type: '3days',
                start: mDayStart.clone().subtract(2, 'days'),
                stop: mDayStart.clone().add(1, 'days')
            };
        } else {
            let start_invalid = !this.validateDatetimeInput(this.startInput);
            let stop_invalid = !this.validateDatetimeInput(this.stopInput);
            if (start_invalid || stop_invalid) {
                return;
            }

            range = {
                type: 'custom',
                start: moment(this.startInput.value),
                stop: moment(this.stopInput.value)
            };
        }

        return range;
    }

    applyNewRange() {
        var range = this.collectRangeData();
        if (!range) {
            return;
        }

        this.setOpenState(false);
        if (this.applyCallback) {
            this.applyCallback(range);
        }
    }
};

export default RangePicker;