/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
// import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from latest to earliest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

// GET Integration Tests
describe("Given I am connected as an employee", () => {
	beforeEach(() => {
		jest.spyOn(mockStore, "bills");
		Object.defineProperty(window, "localStorage", {  value: localStorageMock, });
		window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a", }));
	});

	describe("When I navigate to BillsUI", () => {
		test("fetches bills from mock API GET", async () => {
			const bills = await mockStore.bills().list();
    		expect(bills.length).toBe(4);
		});

		describe("When an error occurs on API", () => {
			test("fetches bills from an API and fails with 404 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"));
						},
					};
				});

				document.body.innerHTML = BillsUI({ error: 'Erreur 404' });

				const message = screen.getByText(/Erreur 404/);
				expect(message).toBeTruthy();
			});

			test("fetches messages from an API and fails with 500 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"));
						},
					};
				});

				document.body.innerHTML = BillsUI({ error: 'Erreur 500' });

				const message = screen.getByText(/Erreur 500/);
				expect(message).toBeTruthy();
			});
		});
	});
});